// path: packages/frontend/src/features/requests/components/QuoteAgentModal.tsx

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { SERVICE_QUOTE_CATEGORIES, ServiceQuoteCategory } from "../../../lib/serviceQuoteQuestions";
import apiClient, { uploadAttachments } from "../../../lib/apiClient";
import { TextField, Select, MenuItem, Button, Box, FormControl, InputLabel, Typography, IconButton, Paper, Alert, Avatar, Fade } from '@mui/material';
import AttachmentSection from "./AttachmentSection";
import ServiceLocationManager from "./ServiceLocationManager";
import { X as XIcon, Wrench, User } from 'lucide-react';


// Typing indicator component
const TypingIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
    <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.100' }}>
      <Wrench size={16} />
    </Avatar>
    <Box sx={{
      bgcolor: 'grey.100',
      borderRadius: '18px',
      px: 2,
      py: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5
    }}>
      <Box sx={{
        width: 4,
        height: 4,
        bgcolor: 'grey.500',
        borderRadius: '50%',
        animation: 'typing 1.4s infinite ease-in-out'
      }} />
      <Box sx={{
        width: 4,
        height: 4,
        bgcolor: 'grey.500',
        borderRadius: '50%',
        animation: 'typing 1.4s infinite ease-in-out 0.2s'
      }} />
      <Box sx={{
        width: 4,
        height: 4,
        bgcolor: 'grey.500',
        borderRadius: '50%',
        animation: 'typing 1.4s infinite ease-in-out 0.4s'
      }} />
    </Box>
    <style>{`
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-8px); }
      }
    `}</style>
  </Box>
);

// Chat message bubble component
const ChatBubble = ({ message, sender, isNew = false }: { message: string; sender: 'agent' | 'user'; isNew?: boolean }) => (
  <Fade in={true} timeout={300}>
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      mb: 2,
      justifyContent: sender === 'user' ? 'flex-end' : 'flex-start'
    }}>
      {sender === 'agent' && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <Wrench size={16} />
        </Avatar>
      )}
      <Box sx={{
        maxWidth: '70%',
        bgcolor: sender === 'user' ? 'primary.main' : 'grey.100',
        color: sender === 'user' ? 'white' : 'text.primary',
        borderRadius: '18px',
        px: 2,
        py: 1,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 0,
          height: 0,
          border: '8px solid transparent',
          top: '12px',
          ...(sender === 'user'
            ? { right: '-8px', borderTopColor: 'primary.main' }
            : { left: '-8px', borderTopColor: 'grey.100' }
          )
        }
      }}>
        <Typography variant="body2">{message}</Typography>
      </Box>
      {sender === 'user' && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
          <User size={16} />
        </Avatar>
      )}
    </Box>
  </Fade>
);

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
  const pendingChoiceRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState<boolean | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const GENERIC_QUESTIONS = [
    { key: 'property_type', question: 'What is the property type?', choices: ['Residential', 'Apartment', 'Commercial', 'Other'] },
    { key: 'is_homeowner', question: 'Are you the homeowner?', choices: ['Yes', 'No'] },
    { key: 'problem_description', question: 'Please describe the general problem or need.', textarea: true },
    { key: 'preferred_timing', question: 'What is your preferred timing for the service? (e.g., "ASAP", "This week", "Next Monday afternoon")' },
    { key: 'additional_notes', question: 'Additional notes (specify "none" if not applicable):', textarea: true },
  ];

  const [initialQuestions, setInitialQuestions] = useState<string[]>([]);
  const [genericAnswers, setGenericAnswers] = useState<{ [key: string]: string }>({});
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ServiceQuoteCategory | null>(null);
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [servicePostalCode, setServicePostalCode] = useState('');
  const [serviceCoordinates, setServiceCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const showDebugPanel = import.meta.env.VITE_DEBUG_PANEL === 'true';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (
      (status === 'INITIAL_QUESTIONS' || status === 'FOLLOW_UP_QUESTIONS') &&
      userInputRef.current
    ) {
      setTimeout(() => {
        userInputRef.current?.focus();
      }, 100);
    }
  }, [chatHistory, status]);

  // Handle pending choice selection
  useEffect(() => {
    if (pendingChoiceRef.current && userInput === pendingChoiceRef.current) {
      pendingChoiceRef.current = null;
      handleSend();
    }
  }, [userInput]);

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
    setUseProfileAddress(true);
    setServiceAddress("");
    setServiceCity("");
    setServicePostalCode("");
    setServiceCoordinates(null);
    setGeocodingStatus('idle');
  };

  const geocodeServiceAddress = async () => {
    if (!serviceAddress.trim() || !serviceCity.trim() || !servicePostalCode.trim()) {
      return;
    }

    setGeocodingStatus('loading');

    try {
      const fullAddress = `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}, Canada`;
      console.log('Attempting to geocode:', fullAddress);

      // Load Google Maps API if not already loaded
      if (!window.google || !window.google.maps) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDkEszizq7L57f0sY73jl99ZvvwDwZ_MGY';

        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        console.log('Loading Google Maps API with key:', apiKey.substring(0, 10) + '...');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
        script.async = true;
        script.defer = true;

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('Google Maps API loaded successfully');
            resolve(void 0);
          };
          script.onerror = (error) => {
            console.error('Failed to load Google Maps API:', error);
            reject(error);
          };
          document.head.appendChild(script);
        });
      }

      // Use Google Maps Geocoding service
      const geocoder = new (window as any).google.maps.Geocoder();

      geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
        console.log('Geocoding response:', {
          status,
          resultsCount: results?.length,
          firstResult: results?.[0]?.formatted_address
        });

        if (status === (window as any).google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          console.log('Geocoding successful:', { lat, lng, formattedAddress: results[0].formatted_address });

          setServiceCoordinates({ lat, lng });
          setGeocodingStatus('success');
        } else {
          console.error('Geocoding failed with status:', status);

          // Provide more specific error messages
          let errorMessage = 'Could not verify address';
          switch (status) {
            case (window as any).google.maps.GeocoderStatus.ZERO_RESULTS:
              errorMessage = 'Address not found - please check spelling and try again';
              break;
            case (window as any).google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
              errorMessage = 'Too many requests - please try again later';
              break;
            case (window as any).google.maps.GeocoderStatus.REQUEST_DENIED:
              errorMessage = 'Geocoding service unavailable - please check API key permissions';
              break;
            case (window as any).google.maps.GeocoderStatus.INVALID_REQUEST:
              errorMessage = 'Invalid address format - please check and try again';
              break;
            default:
              errorMessage = `Geocoding failed (${status}) - please check spelling`;
          }

          setGeocodingStatus('error');
        }
      });

    } catch (error) {
      console.error('Geocoding setup error:', error);
      setGeocodingStatus('error');
    }
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

        // --- START: Replace the existing serviceAddressData block with this ---

        let serviceAddressData: {
          service_address: string;
          latitude: number | null;
          longitude: number | null;
          geocoded_address: string | null;
        } | null = null;

        // SCENARIO A: Use Profile Address
        if (useProfileAddress) {
            if (!profile?.address) {
                setErrorMessage("Your profile address is incomplete. Please update it or provide a different service address.");
                setLoading(false);
                return;
            }
            console.log("DEBUG: Using profile address for submission.");
            serviceAddressData = {
                service_address: `${profile.address}, ${profile.city}, ${profile.province} ${profile.postal_code}`,
                latitude: (profile as any).latitude || null,
                longitude: (profile as any).longitude || null,
                geocoded_address: (profile as any).geocoded_address || null
            };
        }
        // SCENARIO B: Use Different Service Address
        else {
            if (!serviceAddress.trim() || !serviceCity.trim() || !servicePostalCode.trim()) {
                setErrorMessage("Please fill out all fields for the different service address.");
                setLoading(false);
                return;
            }
            if (!serviceCoordinates) {
                setErrorMessage("Please click 'Verify Address' for the new service location before submitting.");
                setLoading(false);
                return;
            }
            console.log("DEBUG: Using DIFFERENT service address for submission.");
            serviceAddressData = {
                service_address: `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}`,
                latitude: serviceCoordinates.lat,
                longitude: serviceCoordinates.lng,
                geocoded_address: `${serviceAddress}, ${serviceCity}, BC ${servicePostalCode}, Canada`
            };
        }

        if (!serviceAddressData) {
            setErrorMessage("A valid service address is required.");
            setLoading(false);
            return;
        }

        // --- END: Replacement block ---

        const payload = {
          clarifyingAnswers: structuredAnswers,
          contactInfo: profile,
          category: selectedCategory.key,
          isEmergency: isEmergency,
          ...genericAnswers,
          ...serviceAddressData
        };

        // --- DEBUGGING: Log the payload being sent to backend ---
        console.log("Submitting payload to backend:", JSON.stringify(payload, null, 2));

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
              <Box sx={{ flex: '1 1 auto', overflowY: 'auto', background: '#f8f8f8', padding: '16px', borderRadius: '12px', marginBottom: '12px', minHeight: '200px' }}>
                {chatHistory.map((msg, idx) => (
                  <ChatBubble key={idx} message={msg.message} sender={msg.sender as 'agent' | 'user'} />
                ))}
                {status === 'AWAITING_GPT' && <TypingIndicator />}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50', p: 2 }}>
                {status === 'SELECTING_CATEGORY' && (
                  <Box>
                    <Typography sx={{ fontWeight: 500, mb: 2, color: 'text.secondary' }}>Select a service type:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {SERVICE_QUOTE_CATEGORIES.map((cat) => (
                        <Button
                          key={cat.key}
                          variant="outlined"
                          size="small"
                          onClick={() => handleSelectCategory(cat)}
                          sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'primary.main', color: 'white' }
                          }}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
                {['INITIAL_QUESTIONS', 'FOLLOW_UP_QUESTIONS'].includes(status) && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    {(() => {
                        let inputControl = null;
                        const isGenericPhase = status === 'INITIAL_QUESTIONS' && currentQuestionIndex < GENERIC_QUESTIONS.length;
                        const currentGenericQuestion = isGenericPhase ? GENERIC_QUESTIONS[currentQuestionIndex] : null;

                        if (currentGenericQuestion && currentGenericQuestion.choices) {
                            return (
                              <Box>
                                <Typography sx={{ fontWeight: 500, mb: 2, color: 'text.secondary' }}>
                                  {currentGenericQuestion.question}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {currentGenericQuestion.choices.map(choice => (
                                    <Button
                                      key={choice}
                                      variant="outlined"
                                      size="small"
                                      onClick={() => {
                                        pendingChoiceRef.current = choice;
                                        setUserInput(choice);
                                      }}
                                      sx={{
                                        borderRadius: '20px',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                      }}
                                    >
                                      {choice}
                                    </Button>
                                  ))}
                                </Box>
                              </Box>
                            );
                        } else {
                            const isTextarea = currentGenericQuestion?.textarea === true;
                            inputControl = (
                              <TextField
                                inputRef={userInputRef}
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder="Type your answer..."
                                fullWidth
                                multiline={isTextarea}
                                rows={isTextarea ? 3 : 1}
                                variant="outlined"
                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                  }
                                }}
                              />
                            );
                            const questionText = status === 'INITIAL_QUESTIONS'
                              ? initialQuestions[currentQuestionIndex]
                              : followUpQuestions[currentQuestionIndex - initialQuestions.length];

                            return (
                              <Box>
                                <Typography sx={{ fontWeight: 500, mb: 2, color: 'text.secondary' }}>
                                  {questionText || 'Your answer:'}
                                </Typography>
                                {inputControl}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                  <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading || userInput.trim() === ''}
                                    sx={{ borderRadius: '20px', px: 3 }}
                                  >
                                    {loading ? 'Sending...' : 'Send'}
                                  </Button>
                                </Box>
                              </Box>
                            );
                        }
                    })()}
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
                   <Box sx={{ textAlign: 'center', mb: 3 }}>
                     <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                       Please review your request
                     </Typography>
                     {isEmergency && (
                       <Box sx={{
                         bgcolor: 'error.main',
                         color: 'white',
                         px: 2,
                         py: 1,
                         borderRadius: 2,
                         display: 'inline-block',
                         fontWeight: 'bold',
                         fontSize: '0.9rem'
                       }}>
                         🚨 EMERGENCY REQUEST
                       </Box>
                     )}
                   </Box>

                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                     {/* Service Details Card */}
                     <Paper sx={{
                       p: 3,
                       borderRadius: 2,
                       border: '1px solid',
                       borderColor: 'divider',
                       bgcolor: 'grey.50'
                     }}>
                       <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                         Service Details
                       </Typography>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                         <Wrench size={20} />
                         <Typography variant="body1" sx={{ fontWeight: 500 }}>
                           {selectedCategory?.label}
                         </Typography>
                       </Box>
                     </Paper>

                     {/* Your Answers Card */}
                     <Paper sx={{
                       p: 3,
                       borderRadius: 2,
                       border: '1px solid',
                       borderColor: 'divider'
                     }}>
                       <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                         Your Answers
                       </Typography>
                       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                         {summaryAnswers.map((item, i) => (
                           <Box key={i} sx={{
                             p: 2,
                             bgcolor: 'grey.50',
                             borderRadius: 1,
                             border: '1px solid',
                             borderColor: 'grey.200'
                           }}>
                             <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                               {item.question}
                             </Typography>
                             <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>
                               {item.answer}
                             </Typography>
                           </Box>
                         ))}
                       </Box>
                     </Paper>

                     <ServiceLocationManager
                       mode="create"
                       isAdmin={false}
                       onDataChange={(addressData) => {
                         // Update the parent component's state with address data
                         if (addressData.service_address) {
                           // Parse the address back into components for form submission
                           const parts = addressData.service_address.split(', ');
                           if (parts.length >= 2) {
                             setServiceAddress(parts[0]);
                             const cityPostal = parts[1].split(' ');
                             if (cityPostal.length >= 2) {
                               setServiceCity(cityPostal.slice(0, -2).join(' '));
                               setServicePostalCode(cityPostal.slice(-2).join(' '));
                             }
                           }
                           setServiceCoordinates(addressData.latitude && addressData.longitude ?
                             { lat: addressData.latitude, lng: addressData.longitude } : null);
                         }
                       }}
                     />

                     {/* Contact Information Card */}
                     {profile && (
                       <Paper sx={{
                         p: 3,
                         borderRadius: 2,
                         border: '1px solid',
                         borderColor: 'divider'
                       }}>
                         <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                           Contact Information
                         </Typography>
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                           <Box sx={{ display: 'flex', gap: 1 }}>
                             <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 60 }}>Name:</Typography>
                             <Typography variant="body2">{profile.name}</Typography>
                           </Box>
                           <Box sx={{ display: 'flex', gap: 1 }}>
                             <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 60 }}>Email:</Typography>
                             <Typography variant="body2">{profile.email}</Typography>
                           </Box>
                           <Box sx={{ display: 'flex', gap: 1 }}>
                             <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 60 }}>Phone:</Typography>
                             <Typography variant="body2">{profile.phone}</Typography>
                           </Box>
                           <Box sx={{ display: 'flex', gap: 1 }}>
                             <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 60 }}>Address:</Typography>
                             <Typography variant="body2">{profile.address}, {profile.city}, {profile.province} {profile.postal_code}</Typography>
                           </Box>
                         </Box>
                       </Paper>
                     )}

                     {/* Attachments Section */}
                     <Paper sx={{
                       p: 3,
                       borderRadius: 2,
                       border: '1px solid',
                       borderColor: 'divider',
                       bgcolor: 'grey.50'
                     }}>
                       <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                         Attachments
                       </Typography>
                       <AttachmentSection
                         requestId="new-request"
                         attachments={[]}
                         pendingFiles={newAttachments}
                         editable={true}
                         onUpdate={() => {}}
                         onNewFiles={(files) => setNewAttachments(prev => [...prev, ...files])}
                         onRemovePendingFile={handleRemovePendingFile}
                       />
                     </Paper>
                   </Box>
               </Box>
               {errorMessage && ( <Box sx={{ p: 2, flexShrink: 0 }}> <Alert severity="error">{errorMessage}</Alert> </Box> )}
               <Box sx={{ flexShrink: 0, p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                 <Button
                   variant="contained"
                   color="primary"
                   fullWidth
                   onClick={handleSubmitQuote}
                   disabled={loading}
                   sx={{
                     py: 1.5,
                     fontSize: '1.1rem',
                     fontWeight: 600,
                     borderRadius: '12px',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                     '&:hover': {
                       boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                       transform: 'translateY(-1px)'
                     },
                     transition: 'all 0.2s ease-in-out'
                   }}
                 >
                   {loading ? 'Submitting...' : 'Confirm & Submit Request'}
                 </Button>
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