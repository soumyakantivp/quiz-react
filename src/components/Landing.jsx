import React, { useState } from 'react';
import { examNames } from '../data/exams';

const Landing = ({ onProceed }) => {
    const [examName, setExamName] = useState('');
    const [months, setMonths] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [error, setError] = useState('');

    const handleInputSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!examName.trim()) {
            setError('Please select an exam');
            return;
        }
        if (!months || isNaN(months) || months <= 0) {
            setError('Please enter a valid number of months');
            return;
        }

        setShowOptions(true);
    };

    const handleTestSeries = () => {
        onProceed({
            examName,
            months: parseInt(months),
            type: 'test'
        });
    };

    const handleStudyPlan = () => {
        onProceed({
            examName,
            months: parseInt(months),
            type: 'study'
        });
    };

    const handleBack = () => {
        setShowOptions(false);
        setExamName('');
        setMonths('');
        setError('');
    };

    return (
        <div className="landing-container">
            {/* Input Section - Scrolls up and away */}
            <div className={`landing-input-section ${showOptions ? 'scroll-up' : ''}`}>
                <div className="landing-input-content">
                    <form onSubmit={handleInputSubmit} className="landing-form">
                        <div className="landing-single-line">
                            <span className="landing-text-inline">I am preparing for</span>
                            
                            <select
                                value={examName}
                                onChange={(e) => setExamName(e.target.value)}
                                className="landing-select-inline"
                            >
                                <option value="">exam</option>
                                {examNames.map(exam => (
                                    <option key={exam} value={exam}>{exam}</option>
                                ))}
                            </select>
                            
                            <span className="landing-text-inline">in</span>
                            
                            <input
                                type="number"
                                min="1"
                                value={months}
                                onChange={(e) => setMonths(e.target.value)}
                                placeholder="0"
                                className="landing-input-months"
                            />
                            
                            <span className="landing-text-inline">months</span>
                        </div>

                        {error && <div className="landing-error">{error}</div>}

                        <button type="submit" className="landing-next-btn">
                            Next
                        </button>
                    </form>
                </div>
            </div>

            {/* Options Section - Scrolls up from below */}
            <div className={`landing-options-section ${showOptions ? 'scroll-in' : ''}`}>
                <div className="landing-options-content">
                    <h2 className="options-title">Choose Your Path</h2>
                    <p className="options-subtitle">
                        {examName} in {months} months
                    </p>

                    <div className="options-grid">
                        <button
                            onClick={handleTestSeries}
                            className="option-card test-series"
                        >
                            <div className="option-icon">📝</div>
                            <div className="option-label">Test Series</div>
                        </button>

                        <button
                            onClick={handleStudyPlan}
                            className="option-card study-plan"
                        >
                            <div className="option-icon">📚</div>
                            <div className="option-label">Study Plan</div>
                        </button>
                    </div>

                    <button onClick={handleBack} className="back-button-landing">
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;

