import React, { useState, useRef, useEffect } from "react";
// ...existing code...

const CLARIFYING_QUESTIONS = [
  "What specific fixtures does the homeowner plan to use, or would they like options/recommendations?",
  "Are there any special requirements or features the homeowner is interested in, such as water-saving or smart fixtures?",
  "Is there an existing blueprint or design plan to follow for the renovation?",
  "Will any additional renovations be happening simultaneously that might affect the plumbing work?",
  "Are there any known issues with the existing plumbing that might complicate the renovation process?"
];

const QuoteAgentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; message: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quoteComplete, setQuoteComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (loading || userInput.trim() === "") return;
    setLoading(true);

    // If still answering clarifying questions
    if (currentQuestionIdx < CLARIFYING_QUESTIONS.length) {
      const updatedAnswers = [...clarifyingAnswers, userInput];
      setClarifyingAnswers(updatedAnswers);
      setChatHistory((prev) => [
        ...prev,
        { sender: "user", message: userInput },
      ]);
      setUserInput("");

      // Move to next question or submit all answers
      if (currentQuestionIdx + 1 < CLARIFYING_QUESTIONS.length) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setChatHistory((prev) => [
          ...prev,
          { sender: "agent", message: CLARIFYING_QUESTIONS[currentQuestionIdx + 1] ?? "" },
        ]);
        setLoading(false);
      } else {
        // All questions answered, submit to backend
        try {
          const response = await fetch("/api/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clarifyingAnswers: updatedAnswers }),
          });
          const data = await response.json();
          setChatHistory((prev) => [
            ...prev,
            { sender: "agent", message: data.agentResponse || "Thank you! Here's your quote." },
          ]);
          setQuoteComplete(true);
        } catch (err) {
          setChatHistory((prev) => [
            ...prev,
            { sender: "agent", message: "Sorry, there was an error processing your quote." },
          ]);
        }
        setLoading(false);
      }
      return;
    }

    // After quote is complete, allow follow-up chat
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", message: userInput },
    ]);
    setUserInput("");
    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUp: userInput }),
      });
      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: "agent", message: data.agentResponse || "" },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: "agent", message: "Sorry, there was an error." },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setChatHistory([
        { sender: "agent", message: "Let's get started with your quote!" },
        { sender: "agent", message: CLARIFYING_QUESTIONS[0] ?? "" },
      ]);
      setClarifyingAnswers([]);
      setCurrentQuestionIdx(0);
      setQuoteComplete(false);
      setUserInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        maxWidth: 400,
        width: '100%',
        padding: 24,
        position: 'relative',
      }}>
        <button style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>Request a Quote</h2>
        <div style={{ maxHeight: 220, overflowY: 'auto', background: '#f8f8f8', padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
              <span style={{ background: msg.sender === 'user' ? '#e0f7fa' : '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>{msg.message}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', marginTop: 4 }}
        >
          <input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            disabled={loading || (quoteComplete && !isOpen)}
            placeholder={quoteComplete ? 'Type your message...' : 'Type your answer...'}
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button type="submit" disabled={loading || userInput.trim() === ''} style={{ marginLeft: 8, background: '#009688', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px' }}>
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuoteAgentModal;

