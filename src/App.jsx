import React, { useState, useEffect } from 'react';
import Quiz from './components/Quiz';
import Timer from './components/Timer';
import './styles/app.css';

const App = () => {
    const [theme, setTheme] = useState(() => {
        // Use system preference as default
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    // Timer state for header
    const [timeLeft, setTimeLeft] = useState(300);

    return (
        <div className="app">
            <div className="header-row">
                <h1 className="testbook-title">Test Book</h1>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <span className="timer-header" style={{display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '1.08em'}}>
                        <span role="img" aria-label="clock" style={{marginRight: 4}}>⏰</span>
                        <Timer timeLeft={timeLeft} headerMode />
                    </span>
                    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark/light mode">
                        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>
            </div>
            <Quiz setTimeLeft={setTimeLeft} />
        </div>
    );
};

export default App;