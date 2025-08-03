import React, { useState, useEffect, useRef } from 'react';
import './ConceptAgent.css';
import { motion, AnimatePresence } from 'framer-motion';
import QuizAgent from './QuizAgent';
import { useAuth, API_BASE_URL } from './AuthContext.jsx'; // Correctly import useAuth from AuthContext.jsx
import axios from 'axios';

const ConceptAgent = ({ topic, onClose, studentId, board, classLevel, subject }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentState, setAgentState] = useState('ready');
  const messagesEndRef = useRef(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');

  // New state variables for validation and learning progress
  const [learningProgress, setLearningProgress] = useState({
    understanding: 0,
    examples: 0,
    quizzes: 0,
    totalInteractions: 0
  });
  const [contentQuality, setContentQuality] = useState({
    accuracy: 0,
    relevance: 0,
    clarity: 0
  });
  const [validationStatus, setValidationStatus] = useState({
    input: null,
    response: null,
    content: null
  });
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    // Send initial topic question without setting it in the input
    if (topic) {
      const initialQuestion = `Explain the concept of ${topic}`;

      // Automatically send the question
      (async () => {
        setIsLoading(true);
        setAgentState('thinking');

        // Add topic introduction to the chat
        setMessages([
          {
            type: 'agent',
            content: `Hello! I'm your learning assistant for ${topic} in ${subject} for ${classLevel} ${board} curriculum. I'm here to help you understand this topic better.`
          }
        ]);

        try {
          const response = await axios.post(`${API_BASE_URL}/search`, {
            headers: { 'Content-Type': 'application/json' },
            body: {
              message: initialQuestion,
              studentId,
              board,
              classLevel,
              subject
            }
          });
          console.log("Response returned from server is:" + JSON.stringify(response));
          console.log("Response response.statusText:" + response.statusText);

          if (response.statusText != 'OK') {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.data;
          console.log("Data returned from Server in Use efferct asynch:" + JSON.stringify(data));
          // Add the question and response to the chat
          setMessages(prev => [
            ...prev,
            {
              type: 'user',
              content: initialQuestion
            },
            {
              type: 'agent',
              content: data.results[0]
            }
          ]);
          console.log('Messages Sent to Display:' + JSON.stringify(messages));
        } catch (error) {
          console.error('Error:', error);
          setMessages(prev => [...prev, {
            type: 'agent',
            content: 'Sorry, there was an error processing your request. Please try again.',
            isError: true
          }]);
        } finally {
          setIsLoading(false);
          setAgentState('ready');
          setInput(''); // Ensure input is empty
        }
      })();
    }
  }, [topic, subject, classLevel, board, studentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check server health on component mount
    const checkServerHealth = async () => {
      try {
        // const response = await fetch(API_BASE_URL + '/health');
        const response = await axios.get(API_BASE_URL + '/health');
        if (response.ok) {
          setServerStatus('healthy');
        } else {
          setServerStatus('unhealthy');
        }
      } catch (error) {
        console.error('Server health check failed:', error);
        setServerStatus('unreachable');
      }
    };

    checkServerHealth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatResponse = (response) => {
    // Split response into paragraphs
    const paragraphs = response.split('\n\n');
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="response-paragraph">
        {paragraph}
      </p>
    ));
  };

  const handleError = (error) => {
    console.error('Error:', error);
    return [
      "I apologize, but I'm having trouble processing your request right now.",
      "This could be due to:",
      "• A temporary connection issue",
      "• The server being busy",
      "• An unexpected error",
      "Please try again in a moment. If the problem persists, you can try:",
      "• Refreshing the page",
      "• Asking your question differently",
      "• Coming back later"
    ].join('\n\n');
  };

  // Validation functions
  const validateUserInput = (input) => {
    const validations = {
      length: input.length >= 3 && input.length <= 500,
      format: /^[a-zA-Z0-9\s.,?!-]+$/.test(input),
      relevance: input.toLowerCase().includes(topic.toLowerCase())
    };

    setValidationStatus(prev => ({
      ...prev,
      input: validations
    }));

    return Object.values(validations).every(v => v);
  };

  const validateResponse = (response) => {
    const validations = {
      length: response.length >= 10 && response.length <= 2000,
      format: /[.!?]$/.test(response),
      relevance: response.toLowerCase().includes(topic.toLowerCase())
    };

    setValidationStatus(prev => ({
      ...prev,
      response: validations
    }));

    return Object.values(validations).every(v => v);
  };

  const updateLearningProgress = (type) => {
    setLearningProgress(prev => ({
      ...prev,
      [type]: prev[type] + 1,
      totalInteractions: prev.totalInteractions + 1
    }));
  };

  const updateContentQuality = (response) => {
    const quality = {
      accuracy: Math.random() * 0.3 + 0.7, // Simulated accuracy score
      relevance: Math.random() * 0.3 + 0.7, // Simulated relevance score
      clarity: Math.random() * 0.3 + 0.7 // Simulated clarity score
    };

    setContentQuality(quality);
  };

  // Modified handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setAgentState('thinking');

    // Add user message to the chat
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await fetch(API_BASE_URL + '/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          studentId,
          board,
          classLevel,
          subject,
          skipValidation: true // Add flag to skip validation
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add agent's response to the chat without any validation
      setMessages(prev => [...prev, {
        type: 'agent',
        content: data.response
      }]);

      // Update learning progress
      updateLearningProgress('understanding');
      // Update content quality
      updateContentQuality(data.response);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'agent',
        content: 'Sorry, there was an error processing your request. Please try again.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setAgentState('ready');
    }
  };

  // Modified handleInteractiveAction function
  const handleInteractiveAction = async (action) => {
    if (action === 'quiz') {
      setShowQuiz(true);
      return;
    }

    setIsLoading(true);
    setAgentState('thinking');

    // Create the prompt based on the action
    const prompt = action === 'explain'
      ? `Explain ${topic} in detail for ${classLevel} level.`
      : action === 'example'
        ? `Give a practical example of ${topic} that a ${classLevel} student can understand.`
        : `Create a simple text-based flowchart explaining ${topic} for ${classLevel} level.`;

    // Add user's prompt to the chat first
    setMessages(prev => [...prev, {
      type: 'user',
      content: prompt
    }]);

    try {
      const response = await axios.post(API_BASE_URL + '/chat', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          message: prompt,
          studentId,
          board,
          classLevel,
          subject,
          skipValidation: true
        },
      });
      console.log("Response returned from server is:" + JSON.stringify(response));
      console.log("Response response.statusText:" + response.statusText);
      console.log("response returned from Server:" + JSON.stringify(response.data));

      if (response.statusText != 'OK') {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = response.data;

      // Add agent's response to the chat
      setMessages(prev => [...prev, {
        type: 'agent',
        content: data.response,
        isQuiz: action === 'quiz',
        isDiagram: action === 'diagram'
      }]);

      // Update learning progress
      updateLearningProgress(action === 'quiz' ? 'quizzes' : 'understanding');
      // Update content quality
      updateContentQuality(data.response);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'agent',
        content: 'Sorry, there was an error processing your request. Please try again.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setAgentState('ready');
    }
  };

  // Add progress indicators to the UI
  const renderProgressIndicators = () => (
    <div className="progress-indicators">
      <div className="progress-section">
        <h3>Learning Progress</h3>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(learningProgress.understanding / 10) * 100}%` }}
          />
        </div>
        <p>Understanding: {learningProgress.understanding}/10</p>
        <p>Examples: {learningProgress.examples}</p>
        <p>Quizzes: {learningProgress.quizzes}</p>
      </div>

      <div className="progress-section">
        <h3>Content Quality</h3>
        <div className="quality-metrics">
          <div className="metric">
            <span>Accuracy</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${contentQuality.accuracy * 100}%` }}
              />
            </div>
          </div>
          <div className="metric">
            <span>Relevance</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${contentQuality.relevance * 100}%` }}
              />
            </div>
          </div>
          <div className="metric">
            <span>Clarity</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${contentQuality.clarity * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="concept-agent">
      {showQuiz ? (
        <QuizAgent
          topic={topic}
          onClose={() => setShowQuiz(false)}
          studentId={studentId}
          board={board}
          classLevel={classLevel}
          subject={subject}
        />
      ) : (
        <div className="agent-container">
          <div className="agent-header">
            <button className="back-button" onClick={onClose}>
              <span className="back-icon">←</span>
              <span>Back</span>
            </button>
            <h2>{topic}</h2>
            <p>{subject} - {classLevel} {board}</p>
            <div className={`server-status ${serverStatus}`}>
              Server Status: {serverStatus === 'healthy' ? 'Connected' :
                serverStatus === 'unhealthy' ? 'Unhealthy' :
                  serverStatus === 'unreachable' ? 'Unreachable' : 'Checking...'}
            </div>
          </div>

          {renderProgressIndicators()}

          <div className="interactive-buttons">
            <button
              className="interactive-btn explain"
              onClick={() => handleInteractiveAction('explain')}
              disabled={isLoading}
            >
              <span className="btn-icon">📚</span>
              Explain More
            </button>
            <button
              className="interactive-btn example"
              onClick={() => handleInteractiveAction('example')}
              disabled={isLoading}
            >
              <span className="btn-icon">💡</span>
              Give an Example
            </button>
            <button
              className="interactive-btn diagram"
              onClick={() => handleInteractiveAction('diagram')}
              disabled={isLoading}
            >
              <span className="btn-icon">📊</span>
              Show Diagram
            </button>
            <button
              className="interactive-btn quiz"
              onClick={() => handleInteractiveAction('quiz')}
              disabled={isLoading}
            >
              <span className="btn-icon">❓</span>
              Quiz Me
            </button>
          </div>

          <div className="agent-status">
            <div className={`status-indicator ${agentState}`} />
            <span className="status-text">
              {agentState === 'thinking' ? 'Thinking...' : 'Ready to help'}
            </span>
          </div>

          <div className="messages-container">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`message ${message.type === 'user' ? 'user-message' : 'agent-message'} ${message.isError ? 'error-message' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {typeof message.content === 'string' ? message.content : message.content}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-section">
            <form className="input-container" onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="message-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading || serverStatus !== 'healthy'}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={isLoading || !input.trim() || serverStatus !== 'healthy'}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptAgent; 