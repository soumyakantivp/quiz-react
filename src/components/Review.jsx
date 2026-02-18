import React, { useState } from 'react';
import { renderMathFriendly } from '../utils/renderMathFriendly';

const Review = ({ answeredQuestions, onBack, onRetry }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentQuestion = answeredQuestions[currentIndex];
    const correctCount = answeredQuestions.filter(q => q.isCorrect).length;

    const [aiChunks, setAiChunks] = useState([]);
    
    // Helper function to parse markdown bold format: **text** → <strong>text</strong>
    const renderWithBold = (text) => {
        if (!text) return text;
        const parts = text.split(/(\*\*[^*]+\*\*)/);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
            }
            return <span key={idx}>{part}</span>;
        });
    };
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    // Helper function to intelligently join chunk with accumulated text
    const appendChunk = (accumulated, chunk) => {
        if (!chunk) return accumulated;
        // DON'T remove newlines here - let renderMathFriendly handle them
        // Just normalize line endings to single \n
        chunk = chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        if (!accumulated) return chunk;
        
        const lastChar = accumulated[accumulated.length - 1];
        const firstChar = chunk[0];
        
        // Detect if we need a space
        const lastIsLetter = /[a-zA-Z]/.test(lastChar);
        const lastIsDigit = /\d/.test(lastChar);
        const lastIsCloseBracket = /[)\]}\]]/.test(lastChar);
        const lastIsPercent = lastChar === '%';
        const lastIsOperator = /[+\-×÷=]/.test(lastChar);
        const lastIsPeriod = lastChar === '.';
        
        const firstIsLetter = /[a-zA-Z]/.test(firstChar);
        const firstIsDigit = /\d/.test(firstChar);
        const firstIsOpenBracket = /[(\[{]/.test(firstChar);
        const firstIsOperator = /[+\-×÷=]/.test(firstChar);
        const firstIsPercent = firstChar === '%';
        
        let needsSpace = false;
        
        // Add space between any consecutive letters (word boundaries)
        // This catches: "To" + "solve", "solve" + "the", etc.
        if (lastIsLetter && firstIsLetter) {
            needsSpace = true;
        }
        // Add space before operators and opening brackets
        else if ((lastIsLetter || lastIsDigit || lastIsPercent || lastIsCloseBracket) && 
                 (firstIsOperator || firstIsOpenBracket)) {
            needsSpace = true;
        }
        // Add space after operators before letters/digits
        else if (lastIsOperator && (firstIsLetter || firstIsDigit)) {
            needsSpace = true;
        }
        
        return accumulated + (needsSpace ? ' ' : '') + chunk;
    };
    
    // Helper to apply spacing rules within text (fixes word concatenation during streaming)
    const applySpacingRules = (text) => {
        if (!text) return text;
        let t = text;
        
        // ADD SPACES BETWEEN WORD BOUNDARIES:
        
        // 1. Between lowercase letter and uppercase letter: "solveThe" → "solve The"
        t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
        
        // 2. Before common words when concatenated: "weneedto" → "we need to"
        //    Match pattern: letter + (common word) when not preceded by space
        const commonWords = ['the', 'and', 'we', 'are', 'it', 'to', 'of', 'in', 'is', 'for', 'on', 'by', 'do', 'so', 'be', 'at', 'or', 'as', 'up', 'an', 'no', 'go', 'has', 'have', 'can', 'will', 'would', 'should', 'need', 'step', 'first', 'second', 'third', 'next', 'then'];
        commonWords.forEach(word => {
            const regex = new RegExp(`([a-z])${word}(?=[a-z])`, 'gi');
            t = t.replace(regex, `$1 ${word}`);
        });
        
        // 3. Between lowercase letter and digit: "calculate35%" → "calculate 35%"
        t = t.replace(/([a-z])(\d)/g, '$1 $2');
        
        // 4. Between digit and uppercase letter: "2Next" → "2 Next"  
        t = t.replace(/(\d)([A-Z])/g, '$1 $2');
        
        // 5. Between closing bracket and uppercase: ")Next" → ") Next"
        t = t.replace(/(\))([A-Z])/g, '$1 $2');
        
        // 6. Between percentage and uppercase: "%Next" → "% Next"
        t = t.replace(/(%\s*)([A-Z])/g, '$1 $2');
        
        // 7. Period followed by letter: ".First" → ". First"
        t = t.replace(/(\.)([a-zA-Z])/g, '$1 $2');
        
        // Normalize multiple spaces that might have been created
        t = t.replace(/[ \t]{2,}/g, ' ');
        
        return t;
    };
    
    // Basic formatting for real-time display (does NOT apply full renderMathFriendly)
    // This ensures real-time streaming looks like the final formatted output
    const applyBasicFormatting = (text) => {
        if (!text) return text;
        // Just apply spacing rules, not full math transforms
        // This matches what renderMathFriendly will do, but without the complex paragraph processing
        let t = text;
        // Remove newlines
        t = t.replace(/\r?\n/g, ' ').replace(/\r/g, ' ');
        // Normalize spaces
        t = t.replace(/[ \t]{2,}/g, ' ');
        // Apply spacing fixes
        return applySpacingRules(t);
    };

    const handleNext = () => {
        setAiChunks([]); setAiError('');
        if (currentIndex < answeredQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        setAiChunks([]); setAiError('');
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Stream AI solve with math-friendly formatting
    const handleSolve = async () => {
        setAiChunks([]);
        setAiError('');
        setAiLoading(true);
        let rawText = ''; // Accumulate raw text like in earlier code
        let streamedChunks = [];
        try {
            const res = await fetch('http://localhost:8080/quiz/ai/ask/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentQuestion.question)
            });
            if (!res.body) throw new Error('No response received');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value);
                let lines = buffer.split('\n');
                buffer = lines.pop();
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.startsWith('data:')) {
                        let chunk = line.slice(5).trim();
                        // Filter out empty, meaningless, or repeated chunks
                        if (chunk && chunk !== '"' && chunk !== '“' && chunk !== '”') {
                            // Do NOT remove backslashes - renderMathFriendly needs them for LaTeX conversion
                            streamedChunks.push(chunk);
                            // Accumulate raw text with intelligent spacing
                            rawText = appendChunk(rawText, chunk);
                            // Apply full renderMathFriendly formatting during streaming to ensure consistency
                            setAiChunks([renderMathFriendly(rawText)]);
                        }
                    }
                }
            }
            if (buffer && buffer.startsWith('data:')) {
                let chunk = buffer.slice(5).trim();
                if (chunk && chunk !== '"' && chunk !== '"' && chunk !== '"') {
                    // Do NOT remove backslashes - renderMathFriendly needs them for LaTeX conversion
                    streamedChunks.push(chunk);
                    // Accumulate with intelligent spacing
                    rawText = appendChunk(rawText, chunk);
                    // Apply full renderMathFriendly formatting during streaming
                    setAiChunks([renderMathFriendly(rawText)]);
                }
            }
            // Format and display chunks after streaming completes
            if (streamedChunks.length > 0) {
                // Join chunks with intelligent spacing based on character boundaries
                let joined = '';
                for (let i = 0; i < streamedChunks.length; i++) {
                    const chunk = streamedChunks[i];
                    if (i > 0) {
                        const lastChar = joined[joined.length - 1];
                        const firstChar = chunk[0];
                        const lastIsLetter = /[a-zA-Z]/.test(lastChar);
                        const lastIsDigit = /\d/.test(lastChar);
                        const firstIsLetter = /[a-zA-Z]/.test(firstChar);
                        const firstIsDigit = /\d/.test(firstChar);
                        // Add space between word-words, word-numbers, or numbers-words
                        if ((lastIsLetter && firstIsLetter) ||
                            (lastIsLetter && firstIsDigit) ||
                            (lastIsDigit && firstIsLetter) ||
                            (lastChar === ')' && firstIsLetter) ||
                            (lastChar === ']' && firstIsLetter)) {
                            joined += ' ';
                        }
                    }
                    joined += chunk;
                }
                
                // Clean up LaTeX: convert \div, \times, \text, etc.
                joined = joined.replace(/\\div/g, '÷');
                joined = joined.replace(/\\times/g, '×');
                joined = joined.replace(/\\text\s*\{\s*([^}]+?)\s*\}/g, (m, content) => ' ' + content.trim() + ' ');
                joined = joined.replace(/\\frac\s*\{\s*([^}]+?)\s*\}\s*\{\s*([^}]+?)\s*\}/g, '($1/$2)');
                
                // Remove any remaining extra backslashes
                joined = joined.replace(/\\\s+/g, '');
                
                // Normalize spacing
                joined = joined.replace(/\s{2,}/g, ' ').trim();
                
                // Apply math formatting and set as single formatted block
                const formatted = renderMathFriendly(joined);
                setAiChunks([formatted]);
            } else {
                setAiError('No response received.');
            }
        } catch (err) {
            setAiError('Error: ' + (err.message || 'Failed to fetch AI response.'));
        } finally {
            setAiLoading(false);
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

                <div className="review-buttons" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}>
                    <button 
                        onClick={handlePrevious} 
                        disabled={currentIndex === 0 || aiLoading}
                        className="nav-button"
                    >
                        ← Previous
                    </button>
                    <button 
                        onClick={handleSolve}
                        className="nav-button"
                        style={{background:'#fffbe7',color:'#3a2676',fontWeight:600,minWidth:90,border:'1.5px solid #ffe082'}}
                        disabled={aiLoading}
                    >
                        {aiLoading ? 'Solving...' : 'Solve'}
                    </button>
                    <button 
                        onClick={handleNext} 
                        disabled={currentIndex === answeredQuestions.length - 1 || aiLoading}
                        className="nav-button"
                    >
                        Next →
                    </button>
                </div>
                {(aiLoading || aiChunks.length > 0) && (
                    <div style={{marginTop:16,background:'#f7f7fa',borderRadius:12,padding:'14px 12px',color:'#232946',fontSize:'1em',boxShadow:'0 1.5px 8px 0 rgba(44,22,100,0.08)',whiteSpace:'pre-wrap',wordWrap:'break-word'}}>
                        <strong>Solution:</strong>
                        <div>
                            {aiChunks.length === 0 && aiLoading ? 'Loading...' : aiChunks.map((chunk, idx) => (
                                <div key={idx} style={{marginBottom:4}}>{renderWithBold(chunk)}</div>
                            ))}
                        </div>
                    </div>
                )}
                {aiError && (
                    <div style={{marginTop:16,color:'#d32f2f',fontWeight:600}}>{aiError}</div>
                )}
            </div>

            <div className="review-actions">
                <button onClick={onBack} className="back-button">Back to Score</button>
                <button onClick={onRetry} className="retry-button">Retry Quiz</button>
            </div>
        </div>
    );
};

export default Review;
