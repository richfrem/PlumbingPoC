// packages/frontend/src/features/requests/components/QuoteAgentModal.tsx
// YAML-driven quote intake modal with conversational interface

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { 
  Send, 
  X as CloseIcon, 
  Wrench, 
  AlertCircle, 
  Home, 
  Calendar, 
  ClipboardList,
  MessageCircle,
  User
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import CustomerInfoSection from "./CustomerInfoSection";
import AttachmentSection from "./AttachmentSection";
import { uploadAttachments } from "../../../lib/apiClient";
import { useSubmitQuoteRequest } from "../../../hooks";
import { services as SERVICE_DEFINITIONS } from "../../../lib/serviceDefinitions";

interface QuoteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess: (newRequest: any) => void;
  preselectedService?: string | null;
}

type AgentMessage = {
  role: string;
  content?: unknown;
  text?: string;
  type?: string;
  inputType?: string;
  options?: Array<{ label?: string; value?: string } | string>;
};

type SummaryAnswer = {
  question: string;
  answer: string;
};

type SummaryPayload = {
  service?: {
    label?: string;
    key?: string;
  };
  emergency?: boolean | string;
  answers: SummaryAnswer[];
};

type AddressPayload = {
  service_address: string;
  latitude: number | null;
  longitude: number | null;
  geocoded_address: string | null;
};

const safeParseJson = (input: string): any => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

const isLocalHost =
  typeof window !== "undefined" &&
  window.location.hostname &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1");

// Local dev: Express proxy route, Production: Netlify function
const AGENT_ENDPOINT = isLocalHost
  ? "/api/agents/quote/run"
  : "/.netlify/functions/quote-agent";
const REVIEW_STAGE = "review_summary";

const sanitizeText = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object" && "text" in (value as any)) {
    return sanitizeText((value as any).text);
  }
  return JSON.stringify(value);
};

// Helper function to determine contextual icon based on message content
const getContextualIcon = (text: string) => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('emergency')) {
    return <AlertCircle size={18} style={{ color: '#dc2626' }} />;
  }
  if (lowerText.includes('property') || lowerText.includes('home')) {
    return <Home size={18} style={{ color: '#3182CE' }} />;
  }
  if (lowerText.includes('when') || lowerText.includes('date') || lowerText.includes('time')) {
    return <Calendar size={18} style={{ color: '#3182CE' }} />;
  }
  if (lowerText.includes('review') || lowerText.includes('confirm') || lowerText.includes('summary')) {
    return <ClipboardList size={18} style={{ color: '#3182CE' }} />;
  }
  
  // Default wrench icon for service-related questions
  return <Wrench size={18} style={{ color: '#3182CE' }} />;
};

const resolveServiceKey = (summaryService?: SummaryPayload["service"]) => {
  if (!summaryService) return undefined;
  const providedKey =
    summaryService.key?.toLowerCase().replace(/[^a-z0-9_]+/g, "_")?.replace(/_+/g, "_")?.replace(/^_|_$/g, "") ||
    undefined;
  if (providedKey) {
    const directMatch = SERVICE_DEFINITIONS.find(
      (service) => service.key.toLowerCase() === providedKey
    );
    if (directMatch) return directMatch.key;
  }

  const label = summaryService.label?.toLowerCase().trim();
  if (label) {
    const labelMatch = SERVICE_DEFINITIONS.find(
      (service) => service.title.toLowerCase() === label
    );
    if (labelMatch) return labelMatch.key;
  }

  if (providedKey) return providedKey;
  if (label) {
    return label.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  return undefined;
};

const buildServiceAddressPayload = (
  useProfileAddress: boolean,
  profile: any,
  manualAddress: Partial<AddressPayload>
): AddressPayload => {
  if (useProfileAddress) {
    if (
      !profile?.address ||
      !profile?.city ||
      !profile?.province ||
      !profile?.postal_code
    ) {
      throw new Error(
        "Your profile address is incomplete. Please update it or choose a different service address."
      );
    }
    return {
      service_address: `${profile.address}, ${profile.city}, ${profile.province} ${profile.postal_code}`,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      geocoded_address: profile.geocoded_address ?? null,
    };
  }

  if (!manualAddress?.service_address) {
    throw new Error(
      "Please enter the service address and click Verify Address before submitting."
    );
  }

  if (
    manualAddress.latitude === null ||
    manualAddress.latitude === undefined ||
    manualAddress.longitude === null ||
    manualAddress.longitude === undefined
  ) {
    throw new Error(
      "Service address verification is required. Please verify the address and try again."
    );
  }

  return {
    service_address: manualAddress.service_address,
    latitude: manualAddress.latitude,
    longitude: manualAddress.longitude,
    geocoded_address:
      manualAddress.geocoded_address ?? manualAddress.service_address,
  };
};

export const QuoteAgentModal: React.FC<QuoteAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmissionSuccess,
  preselectedService,
}) => {
  const { profile, user } = useAuth();
  const submitQuoteMutation = useSubmitQuoteRequest();

  const [conversation, setConversation] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [stage, setStage] = useState<"chat" | "summary">("chat");
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [addressData, setAddressData] = useState<Partial<AddressPayload>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>('');

  const resetState = useCallback(() => {
    setConversation([]);
    setInputValue("");
    setIsLoading(false);
    setIsInitializing(false);
    setStage("chat");
    setSummary(null);
    setError(null);
    setAttachments([]);
    setUseProfileAddress(true);
    setAddressData({});
    setIsSubmitting(false);
    sessionIdRef.current = '';
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!isOpen) {
      resetState();
      return () => {
        isCancelled = true;
      };
    }

    // Prevent re-initialization if we already have a conversation
    if (conversation.length > 0) {
      return () => {
        isCancelled = true;
      };
    }

    sessionIdRef.current =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const initializeConversation = async () => {
      setIsInitializing(true);
      setError(null);
      try {
        if (!sessionIdRef.current) {
          throw new Error("Unable to initialize agent session.");
        }

        const response = await fetch(AGENT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            context: {
              sessionId: sessionIdRef.current,
              preselectedService,
              userId: user?.id,
              profile: profile
                ? {
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address,
                    city: profile.city,
                    province: profile.province,
                    postal_code: profile.postal_code,
                  }
                : null,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start agent conversation.");
        }

        const data = await response.json();
        if (!isCancelled) {
          handleAgentResponse(data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("QuoteAgentModal: init error", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to start the quote assistant. Please try again."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    initializeConversation();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, preselectedService, profile, resetState, user, conversation.length]);

  useEffect(() => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, stage]);

  const handleAgentResponse = (data: any) => {
    console.log('[QuoteAgentModal] handleAgentResponse called', { data });
    const returnedMessages = Array.isArray(data?.messages)
      ? (data.messages as AgentMessage[])
      : [];
    console.log('[QuoteAgentModal] Setting conversation to:', returnedMessages.length, 'messages');
    setConversation(returnedMessages);

    if (data?.stage === REVIEW_STAGE && data?.summary) {
      console.log('[QuoteAgentModal] Setting stage to summary');
      setSummary(data.summary as SummaryPayload);
      setStage("summary");
    } else {
      console.log('[QuoteAgentModal] Setting stage to chat');
      setStage("chat");
      setSummary(null);
    }
  };

  const callAgent = useCallback(
    async (messagesPayload: AgentMessage[]) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!sessionIdRef.current) {
          throw new Error("Agent session is not initialized.");
        }

        const response = await fetch(AGENT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesPayload,
            context: {
              sessionId: sessionIdRef.current,
              preselectedService,
              userId: user?.id,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to continue agent conversation.");
        }

        const data = await response.json();
        handleAgentResponse(data);
      } catch (err) {
        console.error("QuoteAgentModal: callAgent error", err);
        setError(
          err instanceof Error
            ? err.message
            : "The assistant is unavailable. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [preselectedService, user?.id]
  );

  const submitReply = useCallback(
    async (reply?: string | AgentMessage) => {
      console.log('[QuoteAgentModal] submitReply called', { reply, isLoading, stage });
      if (isLoading || stage !== "chat") {
        console.log('[QuoteAgentModal] submitReply blocked', { isLoading, stage });
        return;
      }

      let userMessage: AgentMessage;
      if (typeof reply === "object" && reply !== null) {
        // reply is already an AgentMessage
        userMessage = reply;
        console.log('[QuoteAgentModal] Using provided AgentMessage');
      } else {
        // reply is a string, create AgentMessage
        const candidate = typeof reply === "string" ? reply : inputValue;
        const trimmed = candidate?.trim();
        if (!trimmed) {
          console.log('[QuoteAgentModal] submitReply blocked - empty trimmed');
          return;
        }

        console.log('[QuoteAgentModal] submitReply proceeding', { reply: trimmed });
        userMessage = {
          role: "user",
          content: trimmed,
          text: trimmed,
        };
      }

      // Calculate next messages BEFORE updating state
      const nextMessages = [...conversation, userMessage];
      console.log('[QuoteAgentModal] Calculated nextMessages, length:', nextMessages.length);
      
      // Update conversation state
      setConversation(nextMessages);
      console.log('[QuoteAgentModal] setConversation called, new length:', nextMessages.length);

      console.log('[QuoteAgentModal] About to call callAgent with messages:', nextMessages.length);
      await callAgent(nextMessages);
      console.log('[QuoteAgentModal] callAgent completed');

      // Clear input after successful send
      setInputValue('');
    },
    [callAgent, inputValue, isLoading, stage, conversation]
  );

  const handleSendMessage = async (value?: string | AgentMessage) => {
    console.log('[QuoteAgentModal] handleSendMessage called with:', value);
    await submitReply(value);
  };

  const handleFinalSubmit = async () => {
    if (!summary) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const clarifyingAnswers = summary.answers.map((item) => ({
        question: item.question,
        answer: item.answer,
      }));

      const answerLookup = (needle: string) => {
        const lowered = needle.toLowerCase();
        const match = summary.answers.find((answer) =>
          answer.question.toLowerCase().includes(lowered)
        );
        return match?.answer;
      };

      const serviceKey = resolveServiceKey(summary.service) ?? "other";
      const isEmergencyValue =
        typeof summary.emergency === "boolean"
          ? summary.emergency
          : typeof summary.emergency === "string"
          ? summary.emergency.toLowerCase().startsWith("y")
          : false;

      const serviceAddressPayload = buildServiceAddressPayload(
        useProfileAddress,
        profile,
        addressData
      );

      const payload: Record<string, any> = {
        clarifyingAnswers,
        contactInfo: profile,
        category: serviceKey,
        isEmergency: isEmergencyValue,
        property_type: answerLookup("property") ?? undefined,
        is_homeowner: answerLookup("own this property") ?? answerLookup("homeowner") ?? undefined,
        preferred_timing: answerLookup("when would you like") ?? undefined,
        additional_notes:
          answerLookup("additional details") ??
          answerLookup("anything else") ??
          undefined,
        ...serviceAddressPayload,
      };

      const result = await submitQuoteMutation.mutateAsync(payload);
      const newRequest = result?.request;

      if (attachments.length > 0 && newRequest?.id) {
        await uploadAttachments(newRequest.id, attachments);
      }

      onSubmissionSuccess(newRequest);
      onClose();
    } catch (err) {
      console.error("QuoteAgentModal: submission error", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleMessages = useMemo(() => {
    const messages = conversation
      .map((message) => {
        const text =
          typeof message.text === "string"
            ? message.text
            : sanitizeText(message.content);
        return { ...message, text };
      })
      .filter(
        (message) =>
          !(message.role === "assistant" && message.type === "summary")
      );

    console.log('[QuoteAgentModal] visibleMessages:', messages.length, 'messages');
    messages.forEach((msg, i) => {
      console.log(`  Message ${i}: role=${msg.role}, type=${msg.type}, hasOptions=${!!(msg as any).options}`);
    });

    return messages;
  }, [conversation]);

  const serviceDefinition = useMemo(() => {
    if (!summary?.service) return null;
    const normalizedLabel = summary.service.label?.toLowerCase();
    const resolvedKey = resolveServiceKey(summary.service);
    return (
      SERVICE_DEFINITIONS.find(
        (service) =>
          service.title.toLowerCase() === normalizedLabel ||
          service.key === resolvedKey
      ) ?? null
    );
  }, [summary]);

  const emergencyFlag =
    typeof summary?.emergency === "boolean"
      ? summary.emergency
      : typeof summary?.emergency === "string"
      ? summary.emergency.toLowerCase().startsWith("y")
      : false;

  const profileAddressString = profile
    ? `${profile.address}, ${profile.city}, ${profile.province} ${profile.postal_code}`
    : "";

  const handleAttachmentRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDialogClose = () => {
    if (isSubmitting || isLoading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          maxWidth: '500px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <h2 style={{ fontWeight: 'bold', color: '#1976d2', margin: 0 }}>
            Request a Quote
          </h2>
          <button
            onClick={handleDialogClose}
            disabled={isSubmitting || isLoading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {error && (
            <div style={{ padding: '16px', background: '#ffebee', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ color: '#c62828', fontSize: '14px' }}>{error}</div>
            </div>
          )}

          {stage === "chat" && (
            <ChatPanel
              messages={visibleMessages}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendMessage={handleSendMessage}
              isLoading={isLoading || isInitializing}
              scrollAnchorRef={scrollAnchorRef}
            />
          )}

          {stage === "summary" && summary && (
            <SummaryPanel
              summary={summary}
              emergency={emergencyFlag}
              serviceDefinition={serviceDefinition}
              attachments={attachments}
              onAddAttachments={(files) =>
                setAttachments((prev) => [...prev, ...files])
              }
              onRemoveAttachment={handleAttachmentRemove}
              profile={profile}
              profileAddress={profileAddressString}
              useProfileAddress={useProfileAddress}
              onUseProfileAddressChange={setUseProfileAddress}
              onAddressDataChange={(data) =>
                setAddressData((prev) => ({ ...prev, ...data }))
              }
              isSubmitting={isSubmitting || submitQuoteMutation.isPending}
              onSubmit={handleFinalSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
};


interface ChatPanelProps {
  messages: AgentMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (text?: string | AgentMessage) => void;
  isLoading: boolean;
  scrollAnchorRef: React.RefObject<HTMLDivElement>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  scrollAnchorRef,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus whenever new messages arrive or loading finishes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  const handleOptionClick = (option: string) => {
    onSendMessage(option);
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, option: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOptionClick(option);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Conversation bubbles */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((message, index) => {
          console.log(`[ChatPanel] Processing message ${index}:`, {
            role: message.role,
            type: message.type,
            hasOptions: !!(message as any).options,
            text: message.text?.substring(0, 50)
          });

          const isUser = message.role === "user";
          const parsed =
            !isUser && typeof message.text === "string"
              ? safeParseJson(message.text)
              : null;

          const rawOptions =
            (message as any).options ??
            (message.content && (message.content as any).options) ??
            (parsed?.options && Array.isArray(parsed.options)
              ? parsed.options
              : null);

          const normalizedOptions = Array.isArray(rawOptions)
            ? rawOptions
                .map((option: any) => {
                  if (typeof option === "string") {
                    return {
                      label: option,
                      value: option,
                    };
                  }
                  if (option && typeof option === "object") {
                    const label =
                      option.label ??
                      option.value ??
                      sanitizeText(option);
                    const value =
                      option.value ??
                      option.label ??
                      sanitizeText(option);
                    return { label, value };
                  }
                  return null;
                })
                .filter((option): option is { label: string; value: string } =>
                  Boolean(option?.value)
                )
            : [];

          console.log('[ChatPanel] Message options:', {
            messageRole: message.role,
            hasOptions: normalizedOptions.length > 0,
            optionCount: normalizedOptions.length,
            rawOptions,
            normalizedOptions
          });

          const promptText =
            (parsed?.prompt as string | undefined) ??
            (typeof message.text === "string"
              ? message.text
              : sanitizeText(message.content));

          // Dynamic rendering based on message type
          const shouldShowChoiceButtons = message.type === 'choice' && normalizedOptions.length > 0;
          const shouldShowTextInput = message.type === 'input' || (!shouldShowChoiceButtons && !isUser);

          console.log('[ChatPanel] Message rendering decision:', {
            messageRole: message.role,
            messageType: message.type,
            hasOptions: normalizedOptions.length > 0,
            shouldShowChoiceButtons,
            shouldShowTextInput,
            optionCount: normalizedOptions.length
          });

          return (
            <div key={`${message.role}-${index}`}>
              {/* Message bubble */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#E0F0FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '10px',
                      flexShrink: 0,
                    }}
                  >
                    {getContextualIcon(promptText)}
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '75%',
                    background: isUser ? '#2563EB' : '#F8F9FA',
                    color: isUser ? 'white' : '#1F2937',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5',
                  }}
                >
                  <div style={{ fontSize: '14px' }}>
                    {promptText}
                  </div>
                </div>
                {isUser && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '10px',
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} style={{ color: 'white' }} />
                  </div>
                )}
              </div>

              {/* Dynamic UI based on message type */}
              {shouldShowChoiceButtons && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    marginLeft: '46px',
                    marginRight: 'auto',
                    maxWidth: '400px',
                    mt: 1
                  }}
                >
                  {normalizedOptions.map((option, idx) => {
                    console.log(`[ChatPanel] Rendering button ${idx}:`, option.label, option.value);
                    return (
                      <Button
                        key={`${option.value}-${option.label}-${idx}`}
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const value = option.value || option.label;
                          console.log('[ChatPanel] Button clicked, sending option:', value);

                          const userMessage: AgentMessage = {
                            role: "user",
                            text: value,
                            content: value,
                          };

                          console.log('[ChatPanel] Created userMessage:', userMessage);
                          onSendMessage(userMessage);
                          console.log('[ChatPanel] Called onSendMessage');
                        }}
                        sx={{
                          borderRadius: '24px',
                          textTransform: 'none',
                          px: 2.5,
                          py: 1,
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          border: '1.5px solid',
                          borderColor: '#3182CE',
                          color: '#3182CE',
                          bgcolor: 'white',
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          '&:hover': {
                            bgcolor: '#E0F0FF',
                            borderColor: '#2563EB',
                            color: '#2563EB',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                          },
                          '&:active': {
                            bgcolor: '#2563EB',
                            color: 'white',
                            borderColor: '#2563EB',
                            transform: 'translateY(0)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                          }
                        }}
                        tabIndex={0}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </Box>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#E0F0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageCircle size={18} style={{ color: '#3182CE' }} />
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ color: '#3182CE' }} />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Assistant is typing…</span>
            </div>
          </div>
        )}
        <div ref={scrollAnchorRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: '1px solid #e0e0e0',
          padding: '16px',
          background: '#fafafa',
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (inputValue.trim()) {
              onSendMessage(inputValue.trim());
            }
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type your reply…"
            style={{
              flex: 1,
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              outline: 'none',
            }}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim()) {
                  onSendMessage(inputValue.trim());
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() && !isLoading ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};


interface SummaryPanelProps {
  summary: SummaryPayload;
  emergency: boolean;
  serviceDefinition: typeof SERVICE_DEFINITIONS[number] | null;
  attachments: File[];
  onAddAttachments: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  profile: any;
  profileAddress?: string;
  useProfileAddress: boolean;
  onUseProfileAddressChange: (value: boolean) => void;
  onAddressDataChange: (data: Partial<AddressPayload>) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  emergency,
  serviceDefinition,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  profile,
  profileAddress,
  useProfileAddress,
  onUseProfileAddressChange,
  onAddressDataChange,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
        p: 3,
        pt: 2,
      }}
    >
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Please review your request
        </Typography>
        {emergency && (
          <Box
            sx={{
              mt: 1,
              display: "inline-flex",
              bgcolor: "error.main",
              color: "error.contrastText",
              px: 2,
              py: 0.75,
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            🚨 Emergency Request
          </Box>
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Service Details
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {serviceDefinition?.title ?? summary.service?.label ?? "Plumbing Service"}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Your Answers
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {summary.answers.map((item, index) => (
            <Box
              key={`${item.question}-${index}`}
              sx={{
                bgcolor: "grey.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.200",
                p: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}
              >
                {item.question}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {item.answer || "Not provided"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <CustomerInfoSection
        mode="create"
        isAdmin={false}
        initialAddress={profileAddress}
        profileAddress={profileAddress}
        onModeChange={onUseProfileAddressChange}
        onDataChange={onAddressDataChange}
      />

      {profile && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Contact Information
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {profile.name || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {profile.email || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {profile.phone || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Address:</strong>{" "}
              {profileAddress || "Add your address in your profile"}
            </Typography>
          </Box>
        </Paper>
      )}

      <Paper
        variant="outlined"
        sx={{ p: 2, bgcolor: "grey.50", borderStyle: "dashed" }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Attachments (optional)
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Add photos or documents related to your plumbing issue.
        </Typography>
        <AttachmentSection
          requestId="new-request"
          attachments={[]}
          pendingFiles={attachments}
          editable
          onUpdate={() => {}}
          onNewFiles={onAddAttachments}
          onRemovePendingFile={onRemoveAttachment}
        />
      </Paper>

      <Button
        variant="contained"
        color="primary"
        size="large"
        disabled={isSubmitting}
        onClick={onSubmit}
        sx={{ mt: 1 }}
      >
        {isSubmitting ? "Submitting…" : "Confirm & Submit Request"}
      </Button>
    </Box>
  );
};

export default QuoteAgentModal;
