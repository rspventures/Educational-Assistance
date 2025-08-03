import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from './AuthContext.jsx'; // Correctly import useAuth from AuthContext.jsx
import { motion, AnimatePresence } from 'framer-motion';
import SelectedTopic from './SelectedTopic.jsx';

import MyDialog from './MyDialog.jsx';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import './Subjects.css';
// Base URL for your backend API (Centralized in AuthContext.jsx, so not strictly needed here)
// However, if you prefer to have it explicit for API calls, ensure it's consistent.
// const API_BASE_URL = 'http://localhost:5000'; // Keep or remove based on preference, but axios interceptors handle base URL implicitly.


const subjectsIcons = {
  'ICONS': [
    { name: 'Mathematics', icon: '🧮', color: '#FF6B6B' },
    { name: 'Science', icon: '🧪', color: '#4ECDC4' },
    { name: 'English', icon: '📖', color: '#45B7D1' },
    { name: 'Hindi', icon: '📚', color: '#96CEB4' },
    { name: 'Social Studies', icon: '🌍', color: '#FFEEAD' },
    { name: 'History', icon: '🏺', color: '#D4A5A5' },
    { name: 'Physical Education', icon: '🏃‍♂️', color: '#2ECC71' },
    { name: 'General Knowledge', icon: '🧠', color: '#F1C40F' }
  ]
}


function SubjectsComponent() {
  // ######################################################
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogResult, setDialogResult] = useState('');

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setDialogResult(''); // Clear previous result
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setDialogResult('Canceled'); // Indicate cancellation
  };

  const handleConfirmDialog = () => {
    setIsDialogOpen(false);
    setDialogResult('Confirmed'); // Indicate confirmation
  };

  const handleCloseSelectedTopic = () => {
    setShowAgent(false);
    setShowSubjects(true);
  };


  // #######################################################
  // Access user and loading from AuthContext
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [showSubjects, setShowSubjects] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAgent, setShowAgent] = useState(false);

  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');


  // ANIMATION START: Below Code is used to float/Animate characters defined above
  const characters = [
    { emoji: '🎓', className: 'character-1' },
    { emoji: '📚', className: 'character-2' },
    { emoji: '🎨', className: 'character-3' },
    { emoji: '🔬', className: 'character-4' },
    { emoji: '🎮', className: 'character-5' },
    { emoji: '🎵', className: 'character-6' }
  ];

  // State for animated character positions and targets
  const [charPositions, setCharPositions] = useState(
    Array.from({ length: characters.length }, () => ({ x: 0, y: 0 }))
  );
  const [charTargets, setCharTargets] = useState(
    Array.from({ length: characters.length }, () => ({ x: 0, y: 0 }))
  );

  const messagesRef = React.useRef(null);

  // Initialize all emojis at top-left (0,0)
  React.useEffect(() => {
    setCharPositions(characters.map(() => ({ x: 0, y: 0 })));
    if (!messagesRef.current) return;
    const rect = messagesRef.current.getBoundingClientRect();
    setCharTargets(
      characters.map(() => ({ x: Math.random() * (rect.width - 40), y: Math.random() * (rect.height - 40) }))
    );
  }, []);

  React.useEffect(() => {
    let timeout;
    function setNewTargets() {
      if (!messagesRef.current) return;
      const rect = messagesRef.current.getBoundingClientRect();
      setCharTargets(
        characters.map(() => ({ x: Math.random() * (rect.width - 40), y: Math.random() * (rect.height - 40) }))
      );
      timeout = setTimeout(setNewTargets, 3000 + Math.random() * 2000);
    }
    setNewTargets();
    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    let animationFrame;
    function moveToward(current, target, step = 1.2) {
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < step) return { ...target };
      return {
        x: current.x + (dx / dist) * step,
        y: current.y + (dy / dist) * step,
      };
    }
    function animate() {
      setCharPositions(prevPositions => {
        if (!messagesRef.current) return prevPositions;
        const rect = messagesRef.current.getBoundingClientRect();
        return prevPositions.map((pos, idx) => {
          // If out of bounds (right or bottom), reset to top-left
          if (pos.x > rect.width || pos.y > rect.height) {
            return { x: 0, y: 0 };
          }
          return moveToward(pos, charTargets[idx] || pos, 1.2);
        });
      });
      animationFrame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [charTargets]);
  // ANIMATION END: Below Code is used to float/Animate characters defined above

  const fetchSubjectsRef = React.useRef(null);

  useEffect(() => {
    // Skip if still loading or no user
    if (loading || !user || !user.boardName || !user.studentGrade) {
      return;
    }

    // Cancel any pending requests
    if (fetchSubjectsRef.current) {
      fetchSubjectsRef.current.cancel();
    }

    const source = axios.CancelToken.source();
    fetchSubjectsRef.current = source;

    const fetchSubjects = async () => {
      if (subjectsLoading) return; // Prevent concurrent requests
      
      setSubjectsLoading(true);
      setSubjectsError('');
      
      try {
        console.log('Fetching subjects for:', {
          board: user.boardName,
          grade: user.studentGrade
        });
        
        const response = await axios.get(`${API_BASE_URL}/subjects`, {
          params: {
            board: user.boardName,
            class: user.studentGrade
          },
          cancelToken: source.token
        });
        
        if (response.data && response.data.subjects) {
          console.log('Subjects returned:', response.data.subjects);
          setSubjects(response.data.subjects);
          setShowSubjects(true);
          setSubjectsError(''); // Clear any previous errors
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request cancelled:', error.message);
          return; // Don't set error state for cancelled requests
        }
        
        console.error('Error fetching subjects:', error);
        // Only set error if subjects haven't been loaded successfully
        if (!subjects || Object.keys(subjects).length === 0) {
          setSubjects(null);
          setSubjectsError('Failed to fetch subjects');
        }
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();

    // Cleanup function to cancel pending requests
    return () => {
      if (fetchSubjectsRef.current) {
        fetchSubjectsRef.current.cancel('Component unmounted');
      }
    };
  }, [user?.boardName, user?.studentGrade]); // Only re-run if these specific user properties change // Re-run when user or loading state changes

  // Display loading state from AuthProvider
  if (loading) {
    return <div className="text-center p-4">Checking session for subjects...</div>;
  }

  // If user is not authenticated after loading, PrivateRoute should have redirected.
  // This block is a fallback/defensive check.
  if (!user) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
        <strong className="font-bold">Access Denied!</strong>
        <span className="block sm:inline"> You are not logged in to view subjects.</span>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };


  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const handleSubjectClick = (subject) => {
    console.log("Selected Subject is :" + subject + " and Sub Topics are,");
    console.log(subjects[subject]);
    setShowSubjects(false);
    setSelectedSubject(subject);
    setTopics(subjects[subject]);
    setShowTopicsModal(true);
  };

  const handleTopicClick = (topic) => {
    console.log("Topic was selected and selected topic is:" + topic);
    setSelectedSubtopic(topic);
    setShowTopicsModal(false);
    // Get subtopics from curriculumData
    setShowAgent(true);
    setShowSubjects(false);
  };

  return (
    <div className="subjects scrollable-results" ref={messagesRef}>
      {/* Routes for the application */}
      {characters.map((char, idx) => (
        <motion.span
          key={char.className}
          className={char.className + " floating-character"}
          style={{
            position: 'absolute',
            fontSize: '2rem',
            pointerEvents: 'none',
            zIndex: 1,
          }}
          animate={{
            x: charPositions[idx]?.x || 0,
            y: charPositions[idx]?.y || 0,
          }}
          transition={{
            type: "tween",
            ease: "linear",
            duration: 0.8,
          }}
        >
          {char.emoji}
        </motion.span>
      ))}

      {/* ---- Display subjects loading until it pulls subject from backend.. ----*/}
      {subjectsLoading && <div>Loading subjects...</div>}
      {(subjectsError && (!subjects || Object.keys(subjects).length === 0)) && 
        <div style={{ color: 'red' }}>{subjectsError}</div>}
      {(showSubjects && subjects) && (<div className="subjects-header">
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          Select the subject that you would like to learn today.
        </motion.h1>
      </div>)}

      {/* Subjects from backend */}
      <div style={{ marginBottom: '18px', textAlign: 'center' }}>

        {(showSubjects && subjects) && (
          <div>
            <motion.div
              className="subjects-grid"
              variants={containerVariants}
            >
              {Object.keys(subjects).map((subj, idx) => {
                const iconObj = subjectsIcons.ICONS.find(icon => icon.name === subj);
                const icon = iconObj?.icon || '📘';
                const color = iconObj?.color || '#e0f2fe';
                return (
                  <motion.div
                    className="subject-card"
                    onClick={() => handleSubjectClick(subj)}
                    key={subj}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ '--subject-color': subj.color }}
                  >
                    <motion.div
                      className="subject-icon"
                      initial={{ y: 0 }}
                      animate={{ y: [0, 2, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {icon}
                    </motion.div>
                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{subj}</h2>
                    <motion.button
                      className="learn-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Topics
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {showTopicsModal && (
          <motion.div
            className="topics-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="topics-modal-content">
              <h2>Topics under {selectedSubject}</h2>
              <div className="topics-list">
                {topics.map((topic, index) => (
                  <motion.div
                    key={index}
                    className="topic-item"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleTopicClick(topic)}
                  >
                    {topic}
                  </motion.div>
                ))}
              </div>
              <motion.button
                className="close-button"
                onClick={() => {
                  setShowTopicsModal(false);
                  setShowSubjects(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        )}

        {showAgent && (
          <SelectedTopic
            topic={selectedSubtopic}
            onClose={handleCloseSelectedTopic}
            studentId="demo_student"
            board={user.boardName}
            classLevel={user.studentGrade}
            subject={selectedSubject}
          />
        )}
      </div>
    </div>
  );
}

export default SubjectsComponent;