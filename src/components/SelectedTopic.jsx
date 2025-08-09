import React, { useState, useEffect, useRef } from 'react';
import './SelectedTopic.css';
import { motion, AnimatePresence } from 'framer-motion';
import QuizAgent from './QuizAgent';
import { useAuth, API_BASE_URL } from './AuthContext.jsx';
import axios from 'axios';
import Grid from './OperationsGrid.jsx';
import AdditionTopics from './AdditionTopics.jsx';


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
  return (
    <div className="selectedTopic">
      <motion.h3
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        Hello, I'm your teacher today to teach you {subject}. Let's explore the wonderful world of {topic}!
      </motion.h3>

      {topic.toLowerCase() === 'addition'&& (
        <AdditionTopics
          topic={topic}
          onClose={onClose}
          board={board}
          classLevel={classLevel}
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
