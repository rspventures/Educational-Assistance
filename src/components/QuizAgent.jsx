import React, { useState, useEffect, useRef } from 'react';
import './QuizAgent.css';
import { motion, AnimatePresence } from 'framer-motion';

const QuizAgent = ({ topic, onClose, studentId, board, classLevel, subject }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [quizState, setQuizState] = useState('ready'); // ready, active, completed
  const [feedback, setFeedback] = useState(null);
  const [learningProgress, setLearningProgress] = useState({
    understanding: 0,
    accuracy: 0,
    completion: 0,
    totalQuestions: 0
  });

  // AI Agent States
  const [agentState, setAgentState] = useState({
    isAnalyzing: false,
    isAdapting: false,
    currentStrategy: 'standard',
    performanceMetrics: {
      accuracy: 0,
      responseTime: 0,
      userEngagement: 0
    }
  });

  const generateQuiz = async () => {
    setIsLoading(true);
    setQuizState('ready');
    try {
      const timestamp = new Date().getTime();
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate a quiz about ${topic} for ${classLevel} level. Format:
1. Question 1
a) Option 1
b) Option 2
c) Option 3
d) Option 4
[correct: d]

2. Question 2
a) Option 1
b) Option 2
c) Option 3
d) Option 4
[correct: b]

Include 5 questions total. Keep questions concise. Mark correct answers using [correct: x] format after the options, where x is the letter of the correct option.`,
          studentId,
          board,
          classLevel,
          subject,
          skipValidation: true,
          timestamp: timestamp
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      const parsedQuestions = parseQuizResponse(data.response);
      
      // Validate that we have enough questions
      if (parsedQuestions.length < 3) {
        throw new Error('Not enough questions generated');
      }

      setQuestions(parsedQuestions);
      setLearningProgress(prev => ({
        ...prev,
        totalQuestions: parsedQuestions.length
      }));
      setQuizState('active');
    } catch (error) {
      console.error('Error generating quiz:', error);
      setFeedback('Failed to generate quiz. Please try again.');
      // Retry quiz generation on error with a more specific prompt
      setTimeout(async () => {
        try {
          const retryResponse = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Generate a simple quiz about ${topic} for ${classLevel} level. Format each question as:
Question: [question text]
a) [option 1]
b) [option 2]
c) [option 3]
d) [option 4]
[correct: x]

Generate 5 questions. Keep them simple and clear. Mark correct answers using [correct: x] format after the options, where x is the letter of the correct option.`,
              studentId,
              board,
              classLevel,
              subject,
              skipValidation: true
            }),
          });

          if (!retryResponse.ok) {
            throw new Error('Failed to generate quiz on retry');
          }

          const retryData = await retryResponse.json();
          const retryQuestions = parseQuizResponse(retryData.response);
          
          if (retryQuestions.length >= 3) {
            setQuestions(retryQuestions);
            setLearningProgress(prev => ({
              ...prev,
              totalQuestions: retryQuestions.length
            }));
            setQuizState('active');
            setFeedback(null);
          } else {
            throw new Error('Invalid quiz format on retry');
          }
        } catch (retryError) {
          console.error('Error in retry:', retryError);
          setFeedback('Unable to generate quiz. Please try again later.');
          setQuizState('error');
        }
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const parseQuizResponse = (response) => {
    const questions = [];
    const lines = response.split('\n');
    let currentQuestion = null;
    let questionCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('Question:')) {
        if (currentQuestion) {
          if (currentQuestion.options.length === 4 && currentQuestion.correctAnswer !== null) {
            questions.push(currentQuestion);
            questionCount++;
          }
        }
        currentQuestion = {
          question: trimmedLine.replace(/^\d+\.\s*|^Question:\s*/i, ''),
          options: [],
          correctAnswer: null
        };
      } else if (trimmedLine.match(/^[a-d]\)/i) && currentQuestion) {
        const option = trimmedLine.replace(/^[a-d]\)\s*/i, '');
        currentQuestion.options.push(option);
      } else if (trimmedLine.match(/\[correct:\s*([a-d])\]/i) && currentQuestion) {
        const match = trimmedLine.match(/\[correct:\s*([a-d])\]/i);
        if (match) {
          const correctLetter = match[1].toLowerCase();
          currentQuestion.correctAnswer = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
        }
      }
    }

    if (currentQuestion && currentQuestion.options.length === 4 && currentQuestion.correctAnswer !== null) {
      questions.push(currentQuestion);
      questionCount++;
    }

    // Ensure we have at least 3 questions with 4 options each
    if (questionCount < 3 || questions.some(q => q.options.length < 4 || q.correctAnswer === null)) {
      throw new Error('Invalid quiz format');
    }

    return questions;
  };

  const handleAnswer = async (answerIndex) => {
    const currentQuestionData = questions[currentQuestion];
    const selectedAnswer = currentQuestionData.options[answerIndex];
    const correctAnswer = currentQuestionData.options[currentQuestionData.correctAnswer];
    
    try {
      // Send the answer to the validator agent with more specific prompt
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Validate if this answer is correct for the following question:
Question: "${currentQuestionData.question}"
Selected answer: "${selectedAnswer}"
Correct answer: "${correctAnswer}"
Please respond with only "correct" or "incorrect" based on whether the selected answer matches the correct answer.`,
          studentId,
          board,
          classLevel,
          subject,
          skipValidation: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate answer');
      }

      const data = await response.json();
      const validationResponse = data.response.toLowerCase().trim();
      
      // Strict validation check
      const isCorrect = validationResponse === 'correct';

      setUserAnswers([...userAnswers, { 
        questionIndex: currentQuestion, 
        answerIndex, 
        isCorrect,
        correctAnswer: currentQuestionData.correctAnswer
      }]);
      
      // Update score only if answer is correct
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      // Update learning progress
      setLearningProgress(prev => ({
        ...prev,
        understanding: (prev.understanding + (isCorrect ? 1 : 0)) / (currentQuestion + 1),
        accuracy: (score + (isCorrect ? 1 : 0)) / (currentQuestion + 1),
        completion: ((currentQuestion + 1) / questions.length) * 100
      }));

      // Provide feedback with correct answer if wrong
      setFeedback(isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${correctAnswer}`);

      // Move to next question or end quiz
      if (currentQuestion < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion(prev => prev + 1);
          setFeedback(null);
        }, 2000); // Increased delay to show correct answer
      } else {
        setQuizState('completed');
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      // Fallback to direct comparison if validation fails
      const isCorrect = answerIndex === currentQuestionData.correctAnswer;
      setUserAnswers([...userAnswers, { 
        questionIndex: currentQuestion, 
        answerIndex, 
        isCorrect,
        correctAnswer: currentQuestionData.correctAnswer
      }]);
      
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      setFeedback(isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${correctAnswer}`);

      if (currentQuestion < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion(prev => prev + 1);
          setFeedback(null);
        }, 2000); // Increased delay to show correct answer
      } else {
        setQuizState('completed');
      }
    }
  };

  const restartQuiz = async () => {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setScore(0);
    setFeedback(null);
    setQuizState('ready');
    setLearningProgress(prev => ({
      ...prev,
      understanding: 0,
      accuracy: 0,
      completion: 0
    }));
    // Force new quiz generation
    await generateQuiz();
  };

  // Initialize quiz
  useEffect(() => {
    if (quizState === 'ready') {
      generateQuiz();
    }
  }, [topic, quizState]);

  return (
    <div className="quiz-agent">
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>Quiz: {topic}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
            />
          </div>
          <div className="progress-stats">
            <span>Score: {score}/{questions.length}</span>
            <span>Question: {currentQuestion + 1}/{questions.length}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Generating quiz...</div>
        ) : quizState === 'active' && questions[currentQuestion] ? (
          <div className="question-container">
            <h3>{questions[currentQuestion].question}</h3>
            <div className="options-container">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    userAnswers[currentQuestion]?.answerIndex === index
                      ? userAnswers[currentQuestion].isCorrect
                        ? 'correct'
                        : 'incorrect'
                      : ''
                  }`}
                  onClick={() => handleAnswer(index)}
                  disabled={userAnswers[currentQuestion]}
                >
                  {option}
                </button>
              ))}
            </div>
            {feedback && (
              <div className={`feedback ${feedback.includes('Correct!') ? 'correct' : 'incorrect'}`}>
                {feedback}
              </div>
            )}
          </div>
        ) : quizState === 'completed' ? (
          <div className="quiz-completed">
            <h3>Quiz Completed!</h3>
            <p>Final Score: {score}/{questions.length}</p>
            
            <div className="answers-review">
              <h4>Review Your Answers</h4>
              {questions.map((question, index) => (
                <div key={index} className="answer-item">
                  <p className="question-text">{index + 1}. {question.question}</p>
                  <p className="answer-text">
                    Your answer: {userAnswers[index]?.isCorrect ? '✓' : '✗'} {question.options[userAnswers[index]?.answerIndex]}
                  </p>
                  {!userAnswers[index]?.isCorrect && (
                    <p className="correct-answer">
                      Correct answer: {question.options[question.correctAnswer]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="learning-progress">
              <h4>Learning Progress</h4>
              <div className="progress-metrics">
                <div className="metric">
                  <span>Understanding:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${learningProgress.understanding * 100}%` }}
                    />
                  </div>
                </div>
                <div className="metric">
                  <span>Accuracy:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${learningProgress.accuracy * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <button className="restart-button" onClick={restartQuiz}>
              Restart Quiz
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default QuizAgent; 