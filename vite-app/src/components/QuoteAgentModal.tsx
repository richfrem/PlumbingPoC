import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SERVICE_QUOTE_CATEGORIES, ServiceQuoteCategory } from "../lib/serviceQuoteQuestions";

// Diagnostic component to visualize state
const DebugInfo = ({ status, initialCount, followUpCount, answerCount, currentIndex }: { status: string; initialCount: number; followUpCount: number; answerCount: number; currentIndex: number }) => (
  <div style={{ background: '#333', color: '#fff', padding: '8px', marginTop: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
    <div>Status: {status}</div>
    <div>Initial Qs: {initialCount} | Follow-up Qs: {followUpCount}</div>
    <div>Answers: {answerCount} | Current Index: {currentIndex}</div>
  </div>
);

// Define a clear state machine for the modal's flow
type ModalStatus = 'SELECTING_CATEGORY' | 'INITIAL_QUESTIONS' | 'AWAITING_GPT' | 'FOLLOW_UP_QUESTIONS' | 'SUMMARY' | 'SUBMITTED';

const QuoteAgentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { profile } = useAuth();

  const [status, setStatus] = useState<ModalStatus>('SELECTING_CATEGORY');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; message: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialQuestions, setInitialQuestions] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ServiceQuoteCategory | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showDebugPanel = import.meta.env.VITE_DEBUG_PANEL === 'true';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (status === 'INITIAL_QUESTIONS' || status === 'FOLLOW_UP_QUESTIONS') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [status, currentQuestionIndex]);

  const resetState = () => {
    setChatHistory([
      { sender: "agent", message: "Let's get started with your quote!" },
      { sender: "agent", message: "What would you like a quote for?" },
    ]);
    setStatus('SELECTING_CATEGORY');
    setUserInput("");
    setLoading(false);
    setInitialQuestions([]);
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

  const handleSelectCategory = (category: ServiceQuoteCategory) => {
    setSelectedCategory(category);
    setInitialQuestions(category.questions);
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", message: category.label },
      { sender: "agent", message: category.questions[0] ?? "" },
    ]);
    setCurrentQuestionIndex(0);
    setStatus('INITIAL_QUESTIONS');
  };

  // ✅ FINAL, HARDENED FIX: The logic is now entirely contained and imperative.
  const handleSend = async () => {
    if (loading || userInput.trim() === "") return;

    const currentAnswer = userInput;
    const updatedAnswers = [...allAnswers, currentAnswer];
    
    setAllAnswers(updatedAnswers);
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
            body: JSON.stringify({ clarifyingAnswers: updatedAnswers, category: selectedCategory?.key }),
          });
          const data = await response.json();
          
          if (data.additionalQuestions && data.additionalQuestions.length > 0) {
            // All state transitions are queued AT ONCE, based on the API data, not stale state.
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
        await fetch("/api/submit-quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clarifyingAnswers: allAnswers, contactInfo: profile, category: selectedCategory.key }),
        });
        setStatus('SUBMITTED');
    } catch (err) {
        setChatHistory((prev) => [...prev, { sender: "agent", message: "Sorry, there was an error submitting your quote." }]);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  const renderContent = () => {
    // ... This function remains unchanged ...
    switch (status) {
        case 'SELECTING_CATEGORY':
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Select a service type:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SERVICE_QUOTE_CATEGORIES.map((cat) => (
                  <button key={cat.key} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleSelectCategory(cat)}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          );
        case 'INITIAL_QUESTIONS':
        case 'FOLLOW_UP_QUESTIONS':
          return (
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', marginTop: 4 }}>
                <input ref={inputRef} type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={loading} placeholder="Type your answer..." style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                <button type="submit" disabled={loading || userInput.trim() === ''} style={{ marginLeft: 8, background: '#009688', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px' }}>
                  {loading ? '...' : 'Send'}
                </button>
              </form>
          );
        case 'SUMMARY':
          const allQuestions = [...initialQuestions, ...followUpQuestions];
          return (
            <>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Service Type: {selectedCategory?.label}</div>
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
                </div>
              )}
              <button style={{ width: '100%', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: 16, marginTop: 8 }} onClick={handleSubmitQuote} disabled={loading} >
                {loading ? 'Submitting...' : 'Confirm & Submit Request'}
              </button>
            </>
          );
          case 'SUBMITTED':
              return ( <div style={{ textAlign: 'center', fontWeight: 500 }}> Thank you! Your quote request has been submitted. We will get back to you soon. </div> );
        default: return null;
      }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxWidth: 400, width: '100%', padding: 24, position: 'relative' }}>
        <button style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>Request a Quote</h2>
        <div style={{ maxHeight: 220, overflowY: 'auto', background: '#f8f8f8', padding: 10, borderRadius: 8, marginBottom: 12 }}>
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
        {renderContent()}
        {showDebugPanel && (
          <DebugInfo 
            status={status}
            initialCount={initialQuestions.length}
            followUpCount={followUpQuestions.length}
            answerCount={allAnswers.length}
            currentIndex={currentQuestionIndex}
          />
        )}
      </div>
    </div>
  );
};

export default QuoteAgentModal;