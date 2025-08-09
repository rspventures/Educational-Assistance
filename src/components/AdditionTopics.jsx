import React, { useState, useRef, useEffect } from 'react';
import './AdditionTopics.css';
import { motion } from 'framer-motion';
import { useAuth, API_BASE_URL } from './AuthContext.jsx';
import axios from 'axios';
import Grid from './OperationsGrid.jsx';

const AdditionTopics = ({ topic, onClose, board, classLevel }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [firstNumber, setFirstNumber] = useState('5');
  const [secondNumber, setSecondNumber] = useState('3');
  const [showExplanation, setShowExplanation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const totalSlides = 3;

  const handleNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(curr => curr + 1);
      // Reset animation states when changing slides
      setAnimationComplete(false);
      setShowExplanation(false);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
      // Reset animation states when changing slides
      setAnimationComplete(false);
      setShowExplanation(false);
    }
  };
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

  const handleNumberInput = (value, setter) => {
    setShowExplanation(false)
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 9) {
      setter(value);
    }
  };

  const handleFindOut = () => {
    setShowExplanation(true);
    setAnimationComplete(false);
    setShowResult(false);

    if (currentSlide === 0) {
      // For slide 1: Calculate animation time based on number of objects
      const firstGroupTime = parseInt(firstNumber) * 0.5;
      const secondGroupTime = parseInt(secondNumber) * 0.5;
      const totalDelay = firstGroupTime + secondGroupTime + 3;

      setTimeout(() => {
        setAnimationComplete(true);
      }, totalDelay * 2000);
    }
    // For slide 2, animation completion is handled by onAnimationComplete callbacks
  };

  return (
    <div className="AdditionTopic">
      <div className="navigation-buttons">
        <button
          className="prev-button"
          onClick={handlePrevSlide}
          disabled={currentSlide === 0}
        >
          Previous
        </button>
        <button
          className="next-button"
          onClick={handleNextSlide}
          disabled={currentSlide === totalSlides - 1}
        >
          Next
        </button>
      </div>

      <div className="slides-container">
        {/* Slide 1: Addition with Objects */}
        <motion.div
          className="slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSlide === 0 ? 1 : 0 }}
          style={{ display: currentSlide === 0 ? 'block' : 'none' }}
        >
          <h2>Addition with Objects</h2>
          <div className="question-container">
            <p>If you have <input
              type="number"
              value={firstNumber}
              onChange={(e) => handleNumberInput(e.target.value, setFirstNumber)}
              min="0"
              max="9"
            /> apples and you get <input
                type="number"
                value={secondNumber}
                onChange={(e) => handleNumberInput(e.target.value, setSecondNumber)}
                min="0"
                max="9"
              /> more, how many apples do you have now?</p>
            <button onClick={handleFindOut}>Let's Find Out!</button>

            {showExplanation && (
              <motion.div
                className="explanation-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div className="first-group">
                  {[...Array(parseInt(firstNumber))].map((_, i) => (
                    <motion.span
                      key={`first-${i}`}
                      className="apple-icon"
                      initial={{ y: -100, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        delay: i * 0.5,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      🍎
                    </motion.span>
                  ))}
                </motion.div>
                <motion.div
                  className="plus-sign"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: animationComplete ? 0 : 1,
                    scale: animationComplete ? 0 : 1
                  }}
                  transition={{
                    duration: 0.3,
                    delay: Math.max(parseInt(firstNumber) * 0.2, 1),
                    ease: "easeOut"
                  }}
                >
                  +
                </motion.div>
                <motion.div className="second-group">
                  {[...Array(parseInt(secondNumber))].map((_, i) => (
                    <motion.span
                      key={`second-${i}`}
                      className="apple-icon"
                      initial={{ y: 100, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: animationComplete ? -100 : 0,
                        opacity: 1,
                        scale: 1
                      }}
                      transition={{
                        delay: (parseInt(firstNumber) * 0.5) + 2 + (i * 0.5),
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      🍎
                    </motion.span>
                  ))}
                </motion.div>
                {animationComplete && (
                  <motion.div
                    className="result"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 5,
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }}
                  >
                    {parseInt(firstNumber)} + {parseInt(secondNumber)} = {parseInt(firstNumber) + parseInt(secondNumber)}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Slide 2: Addition with Line */}
        <motion.div
          className="slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSlide === 1 ? 1 : 0 }}
          style={{ display: currentSlide === 1 ? 'block' : 'none' }}
        >
          <h2>Addition with Line</h2>
          <div className="question-container">
            <p>If you need to add <input
              type="number"
              value={firstNumber}
              onChange={(e) => handleNumberInput(e.target.value, setFirstNumber)}
              min="0"
              max="9"
            /> and <input
                type="number"
                value={secondNumber}
                onChange={(e) => handleNumberInput(e.target.value, setSecondNumber)}
                min="0"
                max="9"
              /> using number line then where will you reach on line?</p>

            <button onClick={handleFindOut}>Let's Find Out!</button>

            {showExplanation && (
              <motion.div
                className="number-line-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="number-line">
                  {[...Array(21)].map((_, i) => (
                    <React.Fragment key={i}>
                      <div
                        className="number-mark"
                        style={{ left: `${(i / 20) * 100}%` }}
                      />
                      <div
                        className="number-label"
                        style={{ left: `${(i / 20) * 100}%` }}
                      >
                        {i}
                      </div>
                    </React.Fragment>
                  ))}

                  {/* First number arrow */}
                  <motion.div
                    className="number-arrow"
                    initial={{ left: '0%' }}
                    animate={{
                      left: `${(parseInt(firstNumber) / 20) * 100}%`
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5,
                      type: "spring",
                      stiffness: 50,
                      damping: 12
                    }}
                    onAnimationComplete={() => {
                      setAnimationComplete(true);
                    }}
                  />

                  {/* Second number arrow */}
                  {animationComplete && (
                    <motion.div
                      className="number-arrow second-arrow"
                      initial={{
                        left: `${(parseInt(firstNumber) / 20) * 100}%`,
                        opacity: 0
                      }}
                      animate={{
                        left: `${((parseInt(firstNumber) + parseInt(secondNumber)) / 20) * 100}%`,
                        opacity: 1
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 0.2,
                        type: "spring",
                        stiffness: 50,
                        damping: 12
                      }}
                      onAnimationComplete={() => {
                        // Set state to show the result
                        setShowResult(true);
                      }}
                    />
                  )}
                </div>

                {showResult && (
                  <motion.div
                    className="number-line-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {parseInt(firstNumber)} + {parseInt(secondNumber)} = {parseInt(firstNumber) + parseInt(secondNumber)}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Slide 3: Addition with Column Method */}
        <motion.div
          className="slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSlide === 2 ? 1 : 0 }}
          style={{ display: currentSlide === 2 ? 'block' : 'none' }}
        >
          <div className="question-container-column">
            <h2>Addition with Column Method</h2>
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
            {showGrid && (
              <Grid
                operation={topic}
                num1={inputValue1}
                num2={inputValue2}
                numCols={noOfColumns}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdditionTopics;
