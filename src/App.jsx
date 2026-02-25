import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import TopicSelection from './components/TopicSelection';
import Quiz from './components/Quiz';
import Timer from './components/Timer';
import './styles/app.css';

const App = () => {
    const [theme, setTheme] = useState('dark');

    const [currentPage, setCurrentPage] = useState('landing');
    const [examData, setExamData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(300);

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    const handleLandingProceed = (data) => {
        setExamData(data);
        if (data.type === 'test') {
            setCurrentPage('topics');
        } else {
            setCurrentPage('study');
        }
    };

    const handleTopicSelect = (data) => {
        setExamData(prev => ({ ...prev, ...data }));
        setCurrentPage('quiz');
    };

    const handleBackFromTopics = () => {
        setCurrentPage('landing');
        setExamData(null);
    };

    const handleBackFromQuiz = () => {
        setCurrentPage('topics');
    };

    return (
        <div className="app">
            {/* Single unified header */}
            <div className="app-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="app-name">Letstacle</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark/light mode">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>

                {/* Secondary header info - all within same section */}
                {currentPage === 'topics' && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.95em', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{examData?.examName}</span>
                        </span>
                        <button
                            onClick={handleBackFromTopics}
                            style={{
                                padding: '8px 16px',
                                fontSize: '0.9em',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {currentPage === 'quiz' && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.95em', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{examData?.topicName}</span>
                            <span> • {examData?.examName}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '0.95em' }}>
                                <span style={{ marginRight: 4 }}>⏰</span>
                                <Timer timeLeft={timeLeft} headerMode />
                            </span>
                            <button 
                                onClick={handleBackFromQuiz}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '0.9em',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="app-content">
                {currentPage === 'landing' && (
                    <Landing onProceed={handleLandingProceed} />
                )}

                {currentPage === 'topics' && (
                    <TopicSelection 
                        examName={examData.examName}
                        onTopicSelect={handleTopicSelect}
                        onBack={handleBackFromTopics}
                    />
                )}

                {currentPage === 'quiz' && (
                    <Quiz 
                        setTimeLeft={setTimeLeft}
                        examData={examData}
                        onBack={handleBackFromQuiz}
                    />
                )}
            </div>
        </div>
    );
};

export default App;