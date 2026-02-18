import React from 'react';

const Timer = ({ timeLeft }) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="timer">
            <h3>Time Left: {minutes}:{seconds < 10 ? '0' : ''}{seconds}</h3>
        </div>
    );
};

export default Timer;