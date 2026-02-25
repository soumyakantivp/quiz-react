import React, { useState, useEffect } from 'react';

const TopicSelection = ({ examName, onTopicSelect, onBack }) => {
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        console.log('[TopicSelection] Component mounted with examName:', examName);
        fetchSyllabus();
    }, [examName]);

    const fetchSyllabus = async () => {
        try {
            console.log('[fetchSyllabus] Starting fetch for exam:', examName);
            setLoading(true);
            setError(null);
            
            const url = `http://localhost:8080/quiz/groq/syllabus?examName=${encodeURIComponent(examName)}`;
            console.log('[fetchSyllabus] API URL:', url);
            
            // API endpoint: http://localhost:8080/quiz/groq/syllabus?examName=SBI%20PO
            const response = await fetch(url);
            
            console.log('[fetchSyllabus] Response status:', response.status);
            console.log('[fetchSyllabus] Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[fetchSyllabus] Error response body:', errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[fetchSyllabus] Response data received:', data);
            
            setSyllabus(data);
            console.log('[fetchSyllabus] Syllabus state set successfully');

            // Auto-expand first exam_type section
            if (data.syllabus && data.syllabus.length > 0) {
                const firstExamType = data.syllabus[0].exam_type;
                console.log('[fetchSyllabus] Auto-expanding first section:', firstExamType);
                setExpandedSections({ [firstExamType]: true });
            }
        } catch (err) {
            console.error('[fetchSyllabus] Error caught:', err);
            console.error('[fetchSyllabus] Error message:', err.message);
            console.error('[fetchSyllabus] Error stack:', err.stack);
            setError(err.message || 'Failed to fetch syllabus');
        } finally {
            console.log('[fetchSyllabus] Setting loading to false');
            setLoading(false);
        }
    };

    const toggleSection = (examType) => {
        console.log('[toggleSection] Toggling section:', examType);
        setExpandedSections(prev => {
            const newState = {
                ...prev,
                [examType]: !prev[examType]
            };
            console.log('[toggleSection] New expanded state:', newState);
            return newState;
        });
    };

    const handleTopicClick = (topic, category, examType) => {
        console.log('[handleTopicClick] Topic selected:', { topic, category, examType });
        onTopicSelect({
            examName,
            topicName: topic,
            category,
            examType,
            topicId: `${examType}-${category}-${topic}`.replace(/\s+/g, '-')
        });
    };

    if (loading) {
        console.log('[TopicSelection] Rendering loading state');
        return (
            <div className="topics-container">
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                    <div className="spinner"></div>
                    <p>Loading syllabus for {examName}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        console.log('[TopicSelection] Rendering error state:', error);
        return (
            <div className="topics-container">
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ color: '#e63946', marginBottom: '20px' }}>
                        ❌ {error}
                    </p>
                    <button onClick={fetchSyllabus} className="nav-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!syllabus || !syllabus.syllabus || syllabus.syllabus.length === 0) {
        console.log('[TopicSelection] Rendering empty state. syllabus:', syllabus);
        return (
            <div className="topics-container">
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No topics found for {examName}
                    </p>
                </div>
            </div>
        );
    }

    console.log('[TopicSelection] Rendering syllabus sections. Total items:', syllabus.syllabus.length);

    // Group topics by exam_type
    const groupedBySyllabus = {};
    syllabus.syllabus.forEach(item => {
        console.log('[TopicSelection] Processing item:', item);
        if (!groupedBySyllabus[item.exam_type]) {
            groupedBySyllabus[item.exam_type] = [];
        }
        groupedBySyllabus[item.exam_type].push({
            category: item.category,
            topics: item.topics
        });
    });

    console.log('[TopicSelection] Grouped syllabus by exam_type:', groupedBySyllabus);

    return (
        <div className="topics-container">
            <div className="syllabus-sections">
                {Object.entries(groupedBySyllabus).map(([examType, categories]) => (
                    <div key={examType} className="syllabus-section">
                        <button
                            className="section-header"
                            onClick={() => toggleSection(examType)}
                        >
                            <span className="section-toggle">
                                {expandedSections[examType] ? '▼' : '▶'}
                            </span>
                            <span className="section-title">{examType}</span>
                            <span className="section-count">
                                {categories.reduce((sum, cat) => sum + cat.topics.length, 0)} topics
                            </span>
                        </button>

                        {expandedSections[examType] && (
                            <div className="section-content">
                                {categories.map((cat, idx) => (
                                    <div key={idx} className="category-group">
                                        <h4 className="category-title">{cat.category}</h4>
                                        <div className="topics-gallery">
                                            {cat.topics.map((topic, topicIdx) => (
                                                <button
                                                    key={topicIdx}
                                                    className="topic-tile"
                                                    onClick={() => handleTopicClick(topic, cat.category, examType)}
                                                    title={topic}
                                                >
                                                    <span className="topic-tile-text">{topic}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopicSelection;
