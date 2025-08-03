import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from './AuthContext.jsx'; // Correctly import useAuth from AuthContext.jsx
import axios from 'axios';
import './askai.css';

function AskAI() {

  const [showCharacters, setShowCharacters] = useState(true);
  const [message, setMessage] = useState('');
  const [qaList, setQaList] = useState([]); // [{question, answer}]
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for button disabling
  const [loadinga, setLoadinga] = useState(false);
  const [error, setError] = useState('');
  const resultsEndRef = useRef(null);
  const messagesRef = useRef(null);

  const handleSubmit = async (e) => {

    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      console.log('Sending message:', message);
      const response = await axios.post(`${API_BASE_URL}/search`, 
        { message },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
      if (!response.data) throw new Error('API error');
      const data = response.data;
      setQaList(prev => [
        ...prev,
        { question: message, answer: (data.results && data.results[0]) || '' }
      ]);
      setMessage('');
    } catch (err) {
      setError('Failed to fetch results');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages scrollable-results">

        <ul className="question-Answer">
          {qaList.map((qa, idx) => (
            <li key={idx} className="slate-result-item">
              <div style={{ fontWeight: 600, fontStyle: 'italic', marginBottom: 4, color: '#38bdf8' }}>Q: {qa.question}</div>
              <div style={{ color: '#f1f5f9', paddingBottom: '30px' }}>A: {qa.answer}</div>
              <div className="spacer"></div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ width: '100%' }}>
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ask your question..."
          />
          <button
            className="ask-button"
            type="submit"
            disabled={isSubmitting}
          >
            Ask
          </button>
        </form>
      </div>
    </div>


  );
}

export default AskAI;
