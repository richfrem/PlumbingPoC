import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SERVICE_QUOTE_CATEGORIES, ServiceQuoteCategory } from "../lib/serviceQuoteQuestions";
import { TextField, Select, MenuItem, Button, Box, FormControl, InputLabel, Typography } from '@mui/material';

// Diagnostic component (kept for development)
const DebugInfo = ({ status, isEmergency, initialCount, followUpCount, answerCount, currentIndex }: { status: string; isEmergency: boolean | null; initialCount: number; followUpCount: number; answerCount: number; currentIndex: number }) => (
  <div style={{ background: '#333', color: '#fff', padding: '8px', marginTop: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
    <div>Status: {status} | Emergency: {String(isEmergency)}</div>
    <div>Initial Qs: {initialCount} | Follow-up Qs: {followUpCount}</div>
    <div>Answers: {answerCount} | Current Index: {currentIndex}</div>
  </div>
);

type ModalStatus = 'ASKING_EMERGENCY' | 'SELECTING_CATEGORY' | 'INITIAL_QUESTIONS' | 'AWAITING_GPT' | 'FOLLOW_UP_QUESTIONS' | 'SUMMARY' | 'SUBMITTED';

const QuoteAgentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { profile } = useAuth();

  const [status, setStatus] = useState<ModalStatus>('ASKING_EMERGENCY');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; message: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState<boolean | null>(null);

  // ✅ UPDATED: Added `preferred_timing` to the generic questions list.
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
  const showDebugPanel = import.meta.env.VITE_DEBUG_PANEL === 'true';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const resetState = () => {
    setChatHistory([]);
    setStatus('ASKING_EMERGENCY');
    setIsEmergency(null);
    setUserInput("");
    setLoading(false);
    setInitialQuestions([]);
    setGenericAnswers({});
    setFollowUpQuestions([]);
    setAllAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedCategory(null);
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
      { sender: "user", message: choice ? "Yes, it is an emergency." : "No, it's not an emergency." },
      { sender: "agent", message: "Thank you. What would you like a quote for?" }
    ]);
    setStatus('SELECTING_CATEGORY');
  };

  const handleSelectCategory = (category: ServiceQuoteCategory) => {
    setSelectedCategory(category);
    const combinedQuestions = [
      ...GENERIC_QUESTIONS.map(q => q.question),
      ...category.questions,
    ];
    setInitialQuestions(combinedQuestions);
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", message: category.label },
      { sender: "agent", message: combinedQuestions[0] ?? "" },
    ]);
    setCurrentQuestionIndex(0);
    setStatus('INITIAL_QUESTIONS');
  };

  const handleSend = async () => {
    if (loading || userInput.trim() === "") return;
    const currentAnswer = userInput;
    const updatedRawAnswers = [...allAnswers, currentAnswer];
    setAllAnswers(updatedRawAnswers);
    if (status === 'INITIAL_QUESTIONS' && currentQuestionIndex < GENERIC_QUESTIONS.length) {
      const genericQuestionKey = GENERIC_QUESTIONS[currentQuestionIndex].key;
      setGenericAnswers(prev => ({ ...prev, [genericQuestionKey]: currentAnswer }));
    }
    setChatHistory((prev) => [...prev, { sender: "user", message: currentAnswer }]);
    setUserInput("");
    setLoading(true);
    if (status === 'INITIAL_QUESTIONS') {
      const isLastInitialQuestion = currentQuestionIndex === initialQuestions.length - 1;
      if (isLastInitialQuestion) {
        setStatus('AWAITING_GPT');
        setChatHistory((prev) => [...prev, { sender: "agent", message: "Thank you. Reviewing your answers..." }]);
        try {
          const response = await fetch("/api/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clarifyingAnswers: updatedRawAnswers, category: selectedCategory?.key }),
          });
          const data = await response.json();
          if (data.additionalQuestions && data.additionalQuestions.length > 0) {
            setFollowUpQuestions(data.additionalQuestions);
            setCurrentQuestionIndex(0);
            setStatus('FOLLOW_UP_QUESTIONS');
            setChatHistory((prev) => [...prev, { sender: "agent", message: data.additionalQuestions[0] ?? "" }]);
          } else {
            setStatus('SUMMARY');
          }
        } catch (err) {
          setStatus('SUMMARY');
        } finally {
          setLoading(false);
        }
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
      } else {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setChatHistory((prev) => [...prev, { sender: "agent", message: followUpQuestions[nextIdx] ?? "" }]);
      }
      setLoading(false);
    }
  };
  
  const handleSubmitQuote = async () => {
    if (!profile || !selectedCategory) return;
    setLoading(true);
    try {
        const payload = {
            clarifyingAnswers: allAnswers,
            contactInfo: profile,
            category: selectedCategory.key,
            isEmergency: isEmergency,
            ...genericAnswers
        };
        await fetch("/api/submit-quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setStatus('SUBMITTED');
    } catch (err) {
        setChatHistory((prev) => [...prev, { sender: "agent", message: "Sorry, there was an error submitting your quote." }]);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  const renderContent = () => {
    switch (status) {
        case 'ASKING_EMERGENCY':
          return (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Is this an emergency?</Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" color="error" size="large" onClick={() => handleEmergencyChoice(true)}>
                  Yes
                </Button>
                <Button variant="contained" color="primary" size="large" onClick={() => handleEmergencyChoice(false)}>
                  No
                </Button>
              </Box>
            </Box>
          );
        case 'SELECTING_CATEGORY':
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Select a service type:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SERVICE_QUOTE_CATEGORIES.map((cat) => (
                  <Button key={cat.key} variant="contained" onClick={() => handleSelectCategory(cat)}>
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        case 'INITIAL_QUESTIONS':
        case 'FOLLOW_UP_QUESTIONS': {
            let inputControl = null;
            const isGenericPhase = status === 'INITIAL_QUESTIONS' && currentQuestionIndex < GENERIC_QUESTIONS.length;
            const currentGenericQuestion = isGenericPhase ? GENERIC_QUESTIONS[currentQuestionIndex] : null;

            if (currentGenericQuestion && currentGenericQuestion.choices) {
                inputControl = (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>{currentGenericQuestion.question}</InputLabel>
                        <Select
                            value={userInput}
                            label={currentGenericQuestion.question}
                            onChange={e => setUserInput(e.target.value)}
                        >
                            {currentGenericQuestion.choices.map(choice => (
                                <MenuItem key={choice} value={choice}>{choice}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            } 
            else {
                const isTextarea = currentGenericQuestion?.textarea === true;
                inputControl = (
                    <TextField
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Type your answer..."
                        fullWidth
                        multiline={isTextarea}
                        rows={isTextarea ? 3 : 1}
                        sx={{ mt: 2 }}
                    />
                );
            }

            return (
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    {inputControl}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button type="submit" variant="contained" color="primary" disabled={loading || userInput.trim() === ''}>
                            {loading ? '...' : 'Send'}
                        </Button>
                    </Box>
                </form>
            );
        }
        case 'SUMMARY':
          const allQuestions = [...initialQuestions, ...followUpQuestions];
          return (
            <>
              <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingRight: '8px', marginRight: '-8px' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Service Type: {selectedCategory?.label}</div>
                { isEmergency && <Typography color="error" variant="h6" sx={{ mb: 1 }}>EMERGENCY REQUEST</Typography> }
                <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
                    {allQuestions.map((q, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        <div style={{ fontWeight: 500 }}>{q}</div>
                        <div style={{ color: '#333', marginLeft: 4 }}>{allAnswers[i] || '(No answer)'}</div>
                      </li>
                    ))}
                </ul>
                {profile && (
                  <div style={{ marginTop: 16, padding: 10, background: '#e3f2fd', borderRadius: 6, marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Contact Information:</div>
                    <div><b>Name:</b> {profile.name}</div>
                    <div><b>Email:</b> {profile.email}</div>
                    <div><b>Phone:</b> {profile.phone}</div>
                    <div><b>Address:</b> {profile.address}, {profile.city}, {profile.province} {profile.postal_code}</div>
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0, paddingTop: '16px', borderTop: '1px solid #eee' }}>
                <Button variant="contained" fullWidth onClick={handleSubmitQuote} disabled={loading}>
                  {loading ? 'Submitting...' : 'Confirm & Submit Request'}
                </Button>
              </div>
            </>
          );
          case 'SUBMITTED':
              return ( <div style={{ textAlign: 'center', fontWeight: 500 }}> Thank you! Your quote request has been submitted. We will get back to you soon. </div> );
        default: return null;
      }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          maxWidth: 400, width: '100%', padding: 24, position: 'relative',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        <button style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1976d2', flexShrink: 0 }}>Request a Quote</h2>
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {status !== 'ASKING_EMERGENCY' && (
            <div style={{ maxHeight: 220, overflowY: 'auto', background: '#f8f8f8', padding: 10, borderRadius: 8, marginBottom: 12, flexShrink: 0 }}>
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
                  <span style={{ background: msg.sender === 'user' ? '#e0f7fa' : '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>{msg.message}</span>
                </div>
              ))}
              {status === 'AWAITING_GPT' && (
                 <div style={{ textAlign: 'left', margin: '8px 0' }}>
                     <span style={{ background: '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block', fontStyle: 'italic', color: '#777' }}> Thinking... </span>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
          {renderContent()}
        </div>
        {showDebugPanel && (
          <div style={{ flexShrink: 0 }}>
            <DebugInfo 
              status={status}
              isEmergency={isEmergency}
              initialCount={initialQuestions.length}
              followUpCount={followUpQuestions.length}
              answerCount={allAnswers.length}
              currentIndex={currentQuestionIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteAgentModal;