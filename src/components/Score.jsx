import React from 'react';

const Score = ({ score, totalQuestions, onReview, onRetry }) => {
    const maxScore = totalQuestions * 4;
    const percentage = (score / maxScore) * 100;
    const result = percentage >= 70 ? 'Pass' : 'Fail';

    return (
        <div className="score-container">
            <h2>Quiz Finished!</h2>
            <h3>Your Score</h3>
            <p className="score-text">{score} out of {maxScore}</p>
            <p className="percentage">{percentage.toFixed(2)}%</p>
            <h3 className={result.toLowerCase()}>{result}</h3>
            <div className="button-group">
                <button onClick={onReview} className="review-button">Review Answers</button>
                <button onClick={onRetry} className="retry-button">Retry Quiz</button>
            </div>
        </div>
    );
};

export default Score;