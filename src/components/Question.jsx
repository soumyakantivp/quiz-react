import React from 'react';

const Question = ({ question, onAnswer, onSkip }) => {
    const handleOptionClick = (selectedOption) => {
        // delegate correctness check to the parent (which calls API)
        onAnswer(selectedOption);
    };

    return (
        <div className="question-container">
            <h2>{question.question}</h2>
            <div className="options">
                {question.options.map((option, index) => (
                    <button 
                        key={index} 
                        onClick={() => handleOptionClick(option)}
                        className="option-button"
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button onClick={onSkip} className="skip-button">Skip Question</button>
        </div>
    );
};

export default Question;