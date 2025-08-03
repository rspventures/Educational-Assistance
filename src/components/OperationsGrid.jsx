import React from 'react';
import './Grid.css';
import { col } from 'framer-motion/client';

const Grid = ({ operation, num1, num2, numCols }) => {

    const placeValues = ['O', 'T', 'H', 'Th', 'TTh', 'L', 'TL', 'C', 'TC'];
    const abbreviations = placeValues.slice(0, numCols).reverse();
    const totalCols = numCols + 1;

    // A helper function to perform the arithmetic and handle carry/borrow
    const calculateResult = (operation, num1, num2) => {
        const num1Array = String(num1).padStart(numCols, '0').split('').map(Number);
        const num2Array = String(num2).padStart(numCols, '0').split('').map(Number);

        const results = {
            resultDigits: [],
            carryBorrowDigits: [],
        };

        let carryBorrow = 0;

        // Iterate from right to left (ones place to crores place)
        for (let i = numCols - 1; i >= 0; i--) {
            let digit1 = num1Array[i];
            let digit2 = num2Array[i];

            let currentResult;

            if (operation.toLowerCase() === 'addition') {
                currentResult = digit1 + digit2 + carryBorrow;
                carryBorrow = Math.floor(currentResult / 10);
                results.resultDigits.unshift(currentResult % 10);
                results.carryBorrowDigits.unshift(carryBorrow > 0 ? carryBorrow : '');
            } else if (operation.toLowerCase() === 'subtraction') {
                // For subtraction, borrow is handled
                currentResult = digit1 - digit2 - carryBorrow;
                if (currentResult < 0) {
                    carryBorrow = 1;
                    currentResult += 10;
                } else {
                    carryBorrow = 0;
                }
                results.resultDigits.unshift(currentResult);       
                results.carryBorrowDigits.unshift(carryBorrow > 0 ? (digit1 + 10) : ''); // Store the borrow
            }
        }
        if (carryBorrow > 0) {
            results.resultDigits.unshift(carryBorrow);
        }
        return results;
    };

    // --- New Logic: Perform the calculation and get carry/borrow and result ---
    const results = calculateResult(operation, num1, num2);
    const resultDigits = results.resultDigits;
    const carryBorrowDigits = results.carryBorrowDigits;

    // Initialize a 2D array for the main grid data (6 rows: 1 for carry/borrow, 5 for content)
    const gridData = Array(5).fill(null).map(() => Array(totalCols).fill(''));

    // Place the operation sign in the first column of the 3rd row (index 2)
    if (gridData[2]) {
        const opMap = {
            'addition': '+',
            'subtraction': '-',
            'multiplication': '×',
        };
        gridData[2][0] = opMap[operation.toLowerCase()] || operation;
    }

    // --- Populate num1 in the 3rd row (gridData index 1) ---
    const num1String = String(num1);
    const num1Digits = num1String.split('');

    for (let i = 0; i < num1Digits.length; i++) {
        const colIndex = totalCols - num1Digits.length + i;
        if (gridData[1][colIndex] !== undefined) {
            let carryBorrowValue = 0;
            
            if(carryBorrowDigits[i+1] !== undefined){
                carryBorrowValue = carryBorrowDigits[i+1] ;
            } 
            
            if(carryBorrowValue == 0){
                 gridData[1][colIndex] = num1Digits[i];
            }else{
                if(num1Digits[i] > 0){
                    gridData[1][colIndex] = num1Digits[i] - 1;
                }else{
                    carryBorrowDigits[i] = carryBorrowDigits[i] - 1
                    gridData[1][colIndex] = num1Digits[i];
                }
                 
            }
           
             // Ensure carry/borrow is set
        }
    }

    // --- Populate num2 in the 4th row (gridData index 2) ---
    const num2String = String(num2);
    const num2Digits = num2String.split('');

    for (let i = 0; i < num2Digits.length; i++) {
        const colIndex = totalCols - num2Digits.length + i;
        if (gridData[2][colIndex] !== undefined) {
            gridData[2][colIndex] = num2Digits[i];
        }
    }

    // --- Populate carry/borrow numbers in the first row (gridData index 0) ---
    // The carry/borrow numbers should be aligned to the digits below them
    for (let i = 0; i < carryBorrowDigits.length; i++) {
        const colIndex = (operation.toLowerCase() === 'addition') ? (totalCols - carryBorrowDigits.length + i) - 1 : (totalCols - carryBorrowDigits.length + i);
        if (gridData[0][colIndex] !== undefined) {
            gridData[0][colIndex] = carryBorrowDigits[i];
        }
    }

    // --- Populate the result in the last row (gridData index 4) ---
    for (let i = 0; i < resultDigits.length; i++) {
        const colIndex = totalCols - resultDigits.length + i;
        if (gridData[4][colIndex] !== undefined) {
            gridData[4][colIndex] = resultDigits[i];
        }
    }

    return (

        < div className="grid-container" style={{
            '--num-cols': totalCols
        }
        }>
            {/* Top row: first cell is empty, then abbreviations */}
            < div className="grid-cell empty-abbreviation-cell" ></div >
            {
                abbreviations.map((abbr, index) => (
                    <div key={`abbr-${index}`} className="grid-cell abbreviation-cell">
                        {abbr}
                    </div>
                ))
            }

            {/* --- Render the grid rows with data from gridData --- */}
            {
                gridData.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((cell, colIndex) => (
                            <div
                                key={`row-${rowIndex}-col-${colIndex}`}
                                className={`grid-cell 
                          ${rowIndex === 3 ? 'divider-row' : ''}
                          ${rowIndex === 0 ? 'carry-borrow-cell' : ''}
                          ${rowIndex === 4 ? 'result-cell' : ''}
                          `}>
                                {/* Note: The divider row is handled by a special CSS class */}
                                {rowIndex !== 3 && cell}
                            </div>
                        ))}
                    </React.Fragment>
                ))
            }
        </div >
    );
};

export default Grid;