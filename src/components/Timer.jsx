import React from 'react';


const Timer = ({ timeLeft, headerMode }) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    if (headerMode) {
        return <span style={{color: '#d32f2f', fontWeight: 700}}>{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>;
    }
    return (
        <div className="timer">
            <h3 style={{color: '#d32f2f', fontWeight: 700}}>Time Left: {minutes}:{seconds < 10 ? '0' : ''}{seconds}</h3>
        </div>
    );
};

export default Timer;