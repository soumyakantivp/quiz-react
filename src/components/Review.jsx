import React, { useState } from 'react';
import { renderMathFriendly } from '../utils/renderMathFriendly';

const Review = ({ answeredQuestions, onBack, onRetry }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentQuestion = answeredQuestions[currentIndex];
    const correctCount = answeredQuestions.filter(q => q.isCorrect).length;

    const [aiChunks, setAiChunks] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [translatedChunks, setTranslatedChunks] = useState([]);
    const [isTranslating, setIsTranslating] = useState(false);
    const [rawEnglishText, setRawEnglishText] = useState('');
    
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
        
        const lastIsLetter = /[a-zA-Z]/.test(lastChar);
        const lastIsDigit = /\d/.test(lastChar);
        const lastIsCloseBracket = /[)\]}]/.test(lastChar);
        const lastIsPercent = lastChar === '%';
        const lastIsOperator = /[+\-×÷=]/.test(lastChar);
        
        const firstIsLetter = /[a-zA-Z]/.test(firstChar);
        const firstIsDigit = /\d/.test(firstChar);
        const firstIsOpenBracket = /[([{]/.test(firstChar);
        const firstIsOperator = /[+\-×÷=]/.test(firstChar);

        
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
    // Intelligently adds spaces between words and mathematical expressions
    // Examples: "solveThe" → "solve The", "calculate2" → "calculate 2"
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


    // Translate text to selected language using Google Translate API
    const translateText = async (text, targetLang) => {
        if (targetLang === 'en') {
            setTranslatedChunks([]);
            return;
        }

        setIsTranslating(true);
        try {
            // console.log('=== TRANSLATION REQUEST ===');
            // console.log('Full text to translate:', text);
            // console.log('Target language:', targetLang);
            // console.log('Text length:', text.length);
            
            // Strategy: Extract math expressions and their positions
            // Translate only the text parts, keep math expressions untouched
            const mathRegex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\))/g;
            const parts = [];
            let lastIndex = 0;
            let match;
            
            // Split text into alternating [text, math, text, math, ...]
            while ((match = mathRegex.exec(text)) !== null) {
                // Add text before this math expression
                if (match.index > lastIndex) {
                    parts.push({
                        type: 'text',
                        content: text.substring(lastIndex, match.index)
                    });
                }
                // Add the math expression
                parts.push({
                    type: 'math',
                    content: match[0]
                });
                lastIndex = match.index + match[0].length;
            }
            // Add remaining text after last math expression
            if (lastIndex < text.length) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex)
                });
            }
            
            // console.log('Text split into parts:', parts.length);
            parts.forEach((part, idx) => {
                // console.log(`Part ${idx} (${part.type}): ${part.content.substring(0, 60)}...`);
            });
            
            // Translate only text parts
            const translatedParts = [];
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                
                if (part.type === 'math') {
                    // Keep math expressions as-is
                    translatedParts.push(part.content);
                } else if (part.type === 'text') {
                    // Translate text part
                    const textToTranslate = part.content.trim();
                    if (!textToTranslate) {
                        translatedParts.push(part.content);
                        continue;
                    }
                    
                    // console.log(`\nTranslating text part ${i}: "${textToTranslate.substring(0, 80)}..."`);
                    
                    // Split into smaller chunks if needed
                    const MAX_CHUNK_SIZE = 300;
                    const chunks = [];
                    
                    for (let j = 0; j < textToTranslate.length; j += MAX_CHUNK_SIZE) {
                        let chunk = textToTranslate.substring(j, j + MAX_CHUNK_SIZE);
                        
                        // Try to break at word boundary
                        if (j + MAX_CHUNK_SIZE < textToTranslate.length) {
                            const lastSpace = chunk.lastIndexOf(' ');
                            if (lastSpace > MAX_CHUNK_SIZE * 0.7) {
                                chunk = chunk.substring(0, lastSpace + 1);
                                j -= (MAX_CHUNK_SIZE - lastSpace - 1);
                            }
                        }
                        
                        if (chunk.trim()) {
                            chunks.push(chunk.trim());
                        }
                    }
                    
                    const translatedChunks = [];
                    for (let j = 0; j < chunks.length; j++) {
                        const chunk = chunks[j];
                        // console.log(`  Chunk ${j + 1}/${chunks.length}: "${chunk.substring(0, 60)}..."`);
                        
                        const encodedText = encodeURIComponent(chunk);
                        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodedText}`;
                        
                        const response = await fetch(url);
                        const data = await response.json();
                        const translatedChunk = data[0][0][0];
                        
                        // console.log(`  Translated: "${translatedChunk.substring(0, 60)}..."`);
                        translatedChunks.push(translatedChunk);
                        
                        if (j < chunks.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                    
                    const combinedText = translatedChunks.join(' ');
                    translatedParts.push(combinedText);
                }
            }
            
            // console.log('\n=== FINAL RECONSTRUCTION ===');
            let finalTranslation = '';
            for (let i = 0; i < translatedParts.length; i++) {
                const part = translatedParts[i];
                const isMath = part.startsWith('\\[') || part.startsWith('\\(');
                
                if (isMath) {
                    // Add space before and after math expressions
                    finalTranslation += ' ' + part + ' ';
                } else {
                    finalTranslation += part;
                }
            }
            
            // Clean up multiple spaces
            finalTranslation = finalTranslation.replace(/\s+/g, ' ').trim();
            // console.log('Final translation:', finalTranslation);
            
            setTranslatedChunks([renderMathFriendly(finalTranslation)]);
        } catch (err) {
            // console.error('Translation error:', err);
            setAiError('Error: Failed to translate response.');
        } finally {
            setIsTranslating(false);
        }
    };

    // Handle language change
    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        
        if (rawEnglishText) {
            translateText(rawEnglishText, newLang);
        }
    };

    const handleNext = () => {
        setAiChunks([]); setAiError('');
        setSelectedLanguage('en');
        setTranslatedChunks([]);
        setRawEnglishText('');
        if (currentIndex < answeredQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        setAiChunks([]); setAiError('');
        setSelectedLanguage('en');
        setTranslatedChunks([]);
        setRawEnglishText('');
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Stream AI solve with math-friendly formatting
    const handleSolve = async () => {
        setAiChunks([]);
        setAiError('');
        setAiLoading(true);
        setSelectedLanguage('en');
        setTranslatedChunks([]);
        setRawEnglishText('');
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
                
                // Store raw English text for translation
                setRawEnglishText(joined);
                
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

                <div className="review-buttons" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px'}}>
                    <button 
                        onClick={handlePrevious} 
                        disabled={currentIndex === 0 || aiLoading}
                        className="nav-button"
                    >
                        ← Previous
                    </button>
                    <button 
                        onClick={handleSolve}
                        className="solve-button"
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

                {aiChunks.length > 0 && !aiLoading && (
                    <div style={{marginTop:12,display:'flex',alignItems:'center',gap:'10px',justifyContent:'center'}}>
                        <label htmlFor="language-select" style={{fontWeight:500,fontSize:'0.95em'}}>Language:</label>
                        <select 
                            id="language-select"
                            value={selectedLanguage} 
                            onChange={handleLanguageChange}
                            disabled={isTranslating}
                            style={{padding:'6px 10px',borderRadius:'4px',border:'1px solid #ddd',fontSize:'0.95em',cursor:'pointer',fontWeight:500}}
                        >
                            <option value="en">English</option>
                            <option value="bn">Bengali</option>
                        </select>
                        {isTranslating && <span style={{fontSize:'0.9em',color:'#666'}}>Translating...</span>}
                    </div>
                )}

                {(aiLoading || aiChunks.length > 0) && (
                    <div style={{marginTop:16,background:'var(--bg-secondary)',borderRadius:12,padding:'14px 12px',color:'var(--text-primary)',fontSize:'1em',boxShadow:'0 1.5px 8px 0 rgba(44,22,100,0.08)',whiteSpace:'pre-wrap',wordWrap:'break-word',border:'1px solid var(--border-color)'}}>
                        <strong>Solution:</strong>
                        <div>
                            {aiChunks.length === 0 && aiLoading ? 'Loading...' : (translatedChunks.length > 0 ? translatedChunks.map((chunk, idx) => (
                                <div key={idx} style={{marginBottom:4}}>{renderWithBold(chunk)}</div>
                            )) : aiChunks.map((chunk, idx) => (
                                <div key={idx} style={{marginBottom:4}}>{renderWithBold(chunk)}</div>
                            )))}
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
