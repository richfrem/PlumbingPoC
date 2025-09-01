// vite-app/src/components/QuoteAgentModal.tsx

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SERVICE_QUOTE_CATEGORIES, ServiceQuoteCategory } from "../lib/serviceQuoteQuestions";
import apiClient, { uploadAttachments } from "../lib/apiClient";
import { TextField, Select, MenuItem, Button, Box, FormControl, InputLabel, Typography, IconButton, Paper, Alert } from '@mui/material';
import AttachmentSection from "./AttachmentSection";
import { X as XIcon } from 'lucide-react';

// Diagnostic component (kept for development)
const DebugInfo = ({ status, isEmergency, initialCount, followUpCount, answerCount, currentIndex }: { status: string; isEmergency: boolean | null; initialCount: number; followUpCount: number; answerCount: number; currentIndex: number }) => (
  <div style={{ background: '#333', color: '#fff', padding: '8px', marginTop: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
    <div>Status: {status} | Emergency: {String(isEmergency)}</div>
    <div>Initial Qs: {initialCount} | Follow-up Qs: {followUpCount}</div>
    <div>Answers: {answerCount} | Current Index: {currentIndex}</div>
  </div>
);

type ModalStatus = 'ASKING_EMERGENCY' | 'SELECTING_CATEGORY' | 'INITIAL_QUESTIONS' | 'AWAITING_GPT' | 'FOLLOW_UP_QUESTIONS' | 'SUMMARY' | 'SUBMITTED';

interface QuoteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess: (newRequest: any) => void;
}

const QuoteAgentModal = ({ isOpen, onClose, onSubmissionSuccess }: QuoteAgentModalProps) => {
  const { profile, user } = useAuth();

  const [status, setStatus] = useState<ModalStatus>('ASKING_EMERGENCY');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; message: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState<boolean | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const GENERIC_QUESTIONS = [
    { key: 'property_type', question: 'What is the property type?', choices: ['Residential', 'Apartment', 'Commercial', 'Other'] },
    { key: 'is_homeowner', question: 'Are you the homeowner?', choices: ['Yes', 'No'] },
    { key: 'problem_description', question: 'Please describe the general problem or need.', textarea: true },
    { key: 'preferred_timing', question: 'What is your preferred timing for the service? (e.g., "ASAP", "This week", "Next Monday afternoon")' },
    { key: 'additional_notes', question: 'Additional notes (optional):', textarea: true },
  ];

  const [initialQuestions, setInitialQuestions] = useState<string[]>([]);
  const [genericAnswers, setGenericAnswers] = useState<{ [key: string]: string }>({});
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ServiceQuoteCategory | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  // *** THE CORE FIX IS HERE ***
  const showDebugPanel = import.meta.env.VITE_DEBUG_PANEL === 'true';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const resetState = () => {
    setChatHistory([]);
    setStatus('ASKING_EMERGENCY');
    setIsEmergency(null);
    setNewAttachments([]);
    setUserInput("");
    setLoading(false);
    setInitialQuestions([]);
    setGenericAnswers({});
    setFollowUpQuestions([]);
    setAllAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedCategory(null);
    setErrorMessage("");
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleEmergencyChoice = (choice: boolean) => {
    setIsEmergency(choice);
    setChatHistory([
      { sender: "agent", message: "Is this an emergency?" },
      { sender: "user", message: choice ? "Yes" : "No" },
      { sender: "agent", message: "Thank you. What would you like a quote for?" }
    ]);
    setStatus('SELECTING_CATEGORY');
  };

  const handleSelectCategory = (category: ServiceQuoteCategory) => {
    setSelectedCategory(category);
    const combinedQuestions = [...GENERIC_QUESTIONS.map(q => q.question), ...category.questions];
    setInitialQuestions(combinedQuestions);
    setChatHistory((prev) => [...prev, { sender: "user", message: category.label }, { sender: "agent", message: combinedQuestions[0] ?? "" }]);
    setCurrentQuestionIndex(0);
    setStatus('INITIAL_QUESTIONS');
  };

  const handleSend = async () => {
    if (loading || userInput.trim() === "") return;
    const currentAnswer = userInput;
    
    const allQuestions = [...initialQuestions, ...followUpQuestions];
    const structuredAnswers = [...allAnswers, currentAnswer].map((ans, index) => ({
      question: allQuestions[index] || 'Follow-up',
      answer: ans,
    }));
    
    setAllAnswers(prev => [...prev, currentAnswer]);

    if (status === 'INITIAL_QUESTIONS' && currentQuestionIndex < GENERIC_QUESTIONS.length) {
      const genericQuestionKey = GENERIC_QUESTIONS[currentQuestionIndex]?.key ?? '';
      if (genericQuestionKey) {
        setGenericAnswers(prev => ({ ...prev, [genericQuestionKey]: currentAnswer }));
      }
    }
    
    setChatHistory((prev) => [...prev, { sender: "user", message: currentAnswer }]);
    setUserInput("");
    setLoading(true);

    if (status === 'INITIAL_QUESTIONS') {
      const isLastInitialQuestion = currentQuestionIndex === initialQuestions.length - 1;
      if (isLastInitialQuestion) {
        setStatus('AWAITING_GPT');
        setChatHistory((prev) => [...prev, { sender: "agent", message: "Thank you. I'm just reviewing your answers..." }]);
        try {
          const payload = { clarifyingAnswers: structuredAnswers, category: selectedCategory?.key, problem_description: genericAnswers['problem_description'] || '' };
          const { data } = await apiClient.post('/requests/gpt-follow-up', payload);
          if (data.additionalQuestions && data.additionalQuestions.length > 0) {
            setFollowUpQuestions(data.additionalQuestions);
            setCurrentQuestionIndex(0);
            setStatus('FOLLOW_UP_QUESTIONS');
            setChatHistory((prev) => [...prev, { sender: "agent", message: data.additionalQuestions[0] ?? "" }]);
          } else { 
            setStatus('SUMMARY'); 
            setChatHistory(prev => [...prev, { sender: "agent", message: "Everything looks clear. Please review your request below." }]);
          }
        } catch (err) { 
            console.error("GPT request failed, proceeding to summary.", err); 
            setStatus('SUMMARY'); 
            setChatHistory(prev => [...prev, { sender: "agent", message: "Couldn't reach my assistant, but please review your request below." }]);
        } finally { setLoading(false); }
      } else {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setChatHistory((prev) => [...prev, { sender: "agent", message: initialQuestions[nextIdx] ?? "" }]);
        setLoading(false);
      }
    } else if (status === 'FOLLOW_UP_QUESTIONS') {
      const isLastFollowUpQuestion = currentQuestionIndex === followUpQuestions.length - 1;
      if (isLastFollowUpQuestion) { 
        setStatus('SUMMARY'); 
        setChatHistory(prev => [...prev, { sender: "agent", message: "Thank you. Please review your request below." }]);
      } else {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setChatHistory((prev) => [...prev, { sender: "agent", message: followUpQuestions[nextIdx] ?? "" }]);
      }
      setLoading(false);
    }
  };
  
  const handleSubmitQuote = async () => {
    if (!profile || !selectedCategory || !user) return;
    setLoading(true);
    setErrorMessage("");

    try {
        const allQuestions = [...initialQuestions, ...followUpQuestions];
        const structuredAnswers = allQuestions.map((question, index) => ({ question: question, answer: allAnswers[index] || '(No answer provided)' }));
        const payload = { clarifyingAnswers: structuredAnswers, contactInfo: profile, category: selectedCategory.key, isEmergency: isEmergency, ...genericAnswers };
        
        const { data: result } = await apiClient.post('/requests/submit', payload);
        const newRequest = result.request;
        const newRequestId = newRequest?.id;

        if (newAttachments.length > 0 && newRequestId) {
          await uploadAttachments(newRequestId, newAttachments);
        }

        setStatus('SUBMITTED');

        setTimeout(() => {
          onSubmissionSuccess(newRequest);
          onClose();
        }, 1500);

    } catch (err: any) {
        console.error("Submission Error:", err);
        const errorDetails = err.response?.data?.details ? JSON.stringify(err.response.data.details) : err.message;
        setErrorMessage(`Submission failed: ${errorDetails}. Please try again or call us.`);
        setLoading(false);
    }
  };

  const handleRemovePendingFile = (indexToRemove: number) => {
    setNewAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (status) {
        case 'ASKING_EMERGENCY':
          return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Is this an emergency?</Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" color="error" size="large" onClick={() => handleEmergencyChoice(true)}>Yes, it's an emergency</Button>
                <Button variant="contained" color="primary" size="large" onClick={() => handleEmergencyChoice(false)}>No</Button>
              </Box>
            </Box>
          );
        case 'SELECTING_CATEGORY':
        case 'INITIAL_QUESTIONS':
        case 'FOLLOW_UP_QUESTIONS':
        case 'AWAITING_GPT':
          return (
            <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 3, pt: 1 }}>
              <Box sx={{ flex: '1 1 auto', overflowY: 'auto', background: '#f8f8f8', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                {chatHistory.map((msg, idx) => ( <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}> <span style={{ background: msg.sender === 'user' ? '#e0f7fa' : '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{msg.message}</span> </div> ))}
                {status === 'AWAITING_GPT' && ( <div style={{ textAlign: 'left', margin: '8px 0' }}> <span style={{ background: '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block', fontStyle: 'italic', color: '#777' }}> Thinking... </span> </div> )}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                {status === 'SELECTING_CATEGORY' && (
                  <div>
                    <Typography sx={{ fontWeight: 500, mb: 1 }}>Select a service type:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {SERVICE_QUOTE_CATEGORIES.map((cat) => ( <Button key={cat.key} variant="contained" onClick={() => handleSelectCategory(cat)}>{cat.label}</Button> ))}
                    </Box>
                  </div>
                )}
                {['INITIAL_QUESTIONS', 'FOLLOW_UP_QUESTIONS'].includes(status) && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    {(() => {
                        let inputControl = null;
                        const isGenericPhase = status === 'INITIAL_QUESTIONS' && currentQuestionIndex < GENERIC_QUESTIONS.length;
                        const currentGenericQuestion = isGenericPhase ? GENERIC_QUESTIONS[currentQuestionIndex] : null;

                        if (currentGenericQuestion && currentGenericQuestion.choices) {
                            inputControl = ( <FormControl fullWidth> <InputLabel>{currentGenericQuestion.question}</InputLabel> <Select value={userInput} label={currentGenericQuestion.question} onChange={e => setUserInput(e.target.value)}> {currentGenericQuestion.choices.map(choice => ( <MenuItem key={choice} value={choice}>{choice}</MenuItem> ))} </Select> </FormControl> );
                        } else {
                            const isTextarea = currentGenericQuestion?.textarea === true;
                            inputControl = ( <TextField value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type your answer..." fullWidth multiline={isTextarea} rows={isTextarea ? 3 : 1} /> );
                        }
                        return inputControl;
                    })()}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button type="submit" variant="contained" color="primary" disabled={loading || userInput.trim() === ''}>{loading ? '...' : 'Send'}</Button>
                    </Box>
                  </form>
                )}
              </Box>
            </Box>
          );
        case 'SUMMARY':
          const allQuestions = [...initialQuestions, ...followUpQuestions];
          const summaryAnswers = allQuestions.map((question, index) => ({ question, answer: allAnswers[index] || '(No answer provided)' }));
          return (
            <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ flex: '1 1 auto', overflowY: 'auto', p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Please confirm your details:</Typography>
                  {isEmergency && <Typography color="error" variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>EMERGENCY REQUEST</Typography>}
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="overline" display="block" gutterBottom>Service Type</Typography>
                    <Typography>{selectedCategory?.label}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="overline" display="block" gutterBottom>Your Answers</Typography>
                    {summaryAnswers.map((item, i) => ( <Box key={i} sx={{ mb: 1.5 }}> <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.question}</Typography> <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>&bull; {item.answer}</Typography> </Box> ))}
                  </Paper>
                  {profile && ( <Paper variant="outlined" sx={{ p: 2, mb: 2 }}> <Typography variant="overline" display="block" gutterBottom>Contact Information</Typography> <div><b>Name:</b> {profile.name}</div> <div><b>Email:</b> {profile.email}</div> <div><b>Phone:</b> {profile.phone}</div> <div><b>Address:</b> {profile.address}, {profile.city}, {profile.province} {profile.postal_code}</div> </Paper> )}
                  <AttachmentSection
                    requestId="new-request"
                    attachments={[]}
                    pendingFiles={newAttachments}
                    editable={true}
                    onUpdate={() => {}}
                    onNewFiles={(files) => setNewAttachments(prev => [...prev, ...files])}
                    onRemovePendingFile={handleRemovePendingFile}
                  />
              </Box>
              {errorMessage && ( <Box sx={{ p: 2, flexShrink: 0 }}> <Alert severity="error">{errorMessage}</Alert> </Box> )}
              <Box sx={{ flexShrink: 0, p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Button variant="contained" color="primary" fullWidth onClick={handleSubmitQuote} disabled={loading}>{loading ? 'Submitting...' : 'Confirm & Submit Request'}</Button>
              </Box>
            </Box>
          );
        case 'SUBMITTED':
          return (
            <Box sx={{ textAlign: 'center', p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="h6">Thank you!</Typography>
              <Typography>Your quote request has been submitted. We will get back to you soon.</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>This window will close automatically.</Typography>
            </Box>
          );
        default: return null;
      }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={24} sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxWidth: 500, width: '95%', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1, color: 'grey.500' }}>
          <XIcon size={24} />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, p: 3, pb: 2, color: 'primary.main', flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
          Request a Quote
        </Typography>
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
          {renderContent()}
        </Box>
        {showDebugPanel && (
          <div style={{ flexShrink: 0, padding: '0 24px 24px 24px', borderTop: '1px solid #eee' }}>
            <DebugInfo status={status} isEmergency={isEmergency} initialCount={initialQuestions.length} followUpCount={followUpQuestions.length} answerCount={allAnswers.length} currentIndex={currentQuestionIndex} />
          </div>
        )}
      </Paper>
    </div>
  );
};

export default QuoteAgentModal;