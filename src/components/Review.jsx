import React, { useState } from 'react';

const Review = ({ answeredQuestions, onBack, onRetry }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentQuestion = answeredQuestions[currentIndex];
    const correctCount = answeredQuestions.filter(q => q.isCorrect).length;

    const handleNext = () => {
        if (currentIndex < answeredQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="review-container">
            <h2>Review Your Answers</h2>
            <div className="review-progress">
                <p>Question {currentIndex + 1} of {answeredQuestions.length}</p>
                <p>Correct: {correctCount} / {answeredQuestions.length}</p>
            </div>

            <div className="review-question">
                <h3>{currentQuestion.question}</h3>
                
                <div className="review-options">
                    {currentQuestion.options.map((option, index) => {
                        let className = 'review-option';
                        
                        if (option === currentQuestion.correctAnswer) {
                            className += ' correct';
                        }
                        
                        if (option === currentQuestion.userAnswer && !currentQuestion.isCorrect) {
                            className += ' incorrect';
                        }
                        
                        return (
                            <div key={index} className={className}>
                                <span className="option-text">{option}</span>
                                {option === currentQuestion.correctAnswer && (
                                    <span className="badge correct-badge">Correct</span>
                                )}
                                {option === currentQuestion.userAnswer && !currentQuestion.isCorrect && (
                                    <span className="badge incorrect-badge">Your Answer</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {currentQuestion.userAnswer === null && (
                    <p className="skipped-text">You skipped this question</p>
                )}

                <div className="review-buttons">
                    <button 
                        onClick={handlePrevious} 
                        disabled={currentIndex === 0}
                        className="nav-button"
                    >
                        ← Previous
                    </button>
                    
                    <button 
                        onClick={handleNext} 
                        disabled={currentIndex === answeredQuestions.length - 1}
                        className="nav-button"
                    >
                        Next →
                    </button>
                </div>
            </div>

            <div className="review-actions">
                <button onClick={onBack} className="back-button">Back to Score</button>
                <button onClick={onRetry} className="retry-button">Retry Quiz</button>
            </div>
        </div>
    );
};

export default Review;
