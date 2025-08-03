import React, { useState, useEffect, useRef } from 'react';
import './SelectedTopic.css';
import { motion, AnimatePresence } from 'framer-motion';
import QuizAgent from './QuizAgent';
import { useAuth, API_BASE_URL } from './AuthContext.jsx';
import axios from 'axios';
import Grid from './OperationsGrid.jsx';

const SelectedTopic = ({ topic, onClose, studentId, board, classLevel, subject }) => {
  /*console.log('SelectedTopic component rendered.');
  console.log('Props received:', { topic, studentId, board, classLevel, subject });
  console.log('onClose function:', onClose); // Especially useful for checking if a function prop is passed
  */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentState, setAgentState] = useState('ready');
  const messagesEndRef = useRef(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [inputValue1, setInputValue1] = useState('555');
  const [inputValue2, setInputValue2] = useState('456');
  const [showGrid, setShowGrid] = useState(false); // Renamed for clarity
  const [noOfColumns, setNoOfColumns] = useState(1); // Default to 1 column
  const [showInputPanel, setShowInputPanel] = useState(false);
  // This effect will hide the grid whenever the input values change.
  useEffect(() => {
    setShowGrid(false);
    // The first number must be greater than or equal to the second number for subtraction.
    if (topic.toLowerCase() === 'addition' || topic.toLowerCase() === 'subtraction') {
      setShowInputPanel(true);
    }
  }, [inputValue1, inputValue2]);

  const calculateColumnAddition = () => {
    console.log("Calculation was clicked for:", topic);
    console.log("Input values:", inputValue1, inputValue2);

    if (inputValue1 === '' || inputValue2 === '') {
      // Use a modal or a custom message box instead of alert()
      // For now, we will use a temporary alert
      alert('Please enter both numbers to calculate.');
      return;
    }

    const num1 = parseInt(inputValue1, 10);
    const num2 = parseInt(inputValue2, 10);

    if (isNaN(num1) || isNaN(num2)) {
      alert('Please enter valid numbers.');
      return;
    }

    // --- Subtraction validation ---
    // The first number must be greater than or equal to the second number for subtraction.
    if (topic.toLowerCase() === 'subtraction' && num1 < num2) {
      alert('For subtraction, the first number must be greater than or equal to the second number.');
      return;
    }

    const num1Length = inputValue1.length;
    const num2Length = inputValue2.length;
    const maxLength = Math.max(num1Length, num2Length);

    setNoOfColumns(maxLength);
    setShowGrid(true); // Show the grid only after a successful calculation
    console.log("Number of columns set to:", maxLength);

    const steps = [
      `Step 1: Write the numbers one below the other, aligning them by place value.`,
      `Step 2: Start with the rightmost column (ones place) and perform the operation.`,
      `Step 3: Move to the next column to the left (tens place, hundreds place, etc.), handling any carry or borrow values.`,
      `Step 4: The final result is the number displayed below the line.`
    ];
    setResponse(steps.join('\n'));
  };

  const opMap = {
    'addition': '+',
    'subtraction': '-',
    'multiplication': '×',
  };

  return (
    <div className="chat-container">
      <motion.h3
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        Hello, I'm your teacher today to teach you {subject}. Let's explore the wonderful world of {topic}!
      </motion.h3>
      {showInputPanel && (
        <div className="input-group">
          <input
            type="number"
            id="colAddNum1"
            className="input-field"
            value={inputValue1}
            onChange={(event) => setInputValue1(event.target.value)}
          />
          <span className="plus-sign">
            {opMap[topic.toLowerCase()] || topic}
          </span>
          <input
            type="number"
            id="colAddNum2"
            className="input-field"
            value={inputValue2}
            onChange={(event) => setInputValue2(event.target.value)}
          />
          <button id="calculate-column-addition" className="calculate-button" onClick={calculateColumnAddition}>
            Calculate & Show Steps
          </button>
        </div>
      )}

      {showGrid && (
        <div className="response-container">
          <pre className="response-text">{response}</pre>
        </div>
      )}

      {showGrid && (
        <Grid
          operation={topic}
          num1={inputValue1}
          num2={inputValue2}
          numCols={noOfColumns}
        />
      )}

      <motion.button
        className="close-button"
        onClick={onClose}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Close
      </motion.button>
    </div>
  );
};

export default SelectedTopic;
