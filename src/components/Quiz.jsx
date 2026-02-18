import React, { useState, useEffect } from 'react';
import Question from './Question';
import Score from './Score';
import Review from './Review';

// API endpoints (use absolute backend URLs since CORS is allowed)
const QUIZ_ALL_URL = 'http://localhost:8080/quiz/all';


const Quiz = ({ setTimeLeft }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [timeLeftLocal, setTimeLeftLocal] = useState(300); // 5 minutes timer
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [showReview, setShowReview] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (timeLeftLocal > 0 && !isQuizFinished) {
            const timerId = setInterval(() => {
                setTimeLeftLocal(prevTime => prevTime - 1);
            }, 1000);
            return () => clearInterval(timerId);
        } else if (timeLeftLocal === 0) {
            setIsQuizFinished(true);
        }
    }, [timeLeftLocal, isQuizFinished]);

    // Sync timer with parent for header display
    useEffect(() => {
        if (setTimeLeft) setTimeLeft(timeLeftLocal);
    }, [timeLeftLocal, setTimeLeft]);

    // Fetch questions from API on mount
    useEffect(() => {
        let mounted = true;
        const fetchQuestions = async () => {
            try {
                const res = await fetch(QUIZ_ALL_URL);
                const data = await res.json();

                // map API shape to local shape expected by components, include rightAnswer
                const mapped = data.map(item => ({
                    id: item.id,
                    question: item.questionTilte || item.questionTitle || item.question,
                    options: [item.option1, item.option2, item.option3, item.option4],
                    correctAnswer: item.rightAnswer
                }));

                if (mounted) {
                    setQuestions(mapped);
                    setTotalQuestions(mapped.length);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load questions', err);
                if (mounted) setLoading(false);
            }
        };
        fetchQuestions();
        return () => { mounted = false; };
    }, []);

    const handleAnswer = (selectedAnswer) => {
        const currentQuestion = questions[currentQuestionIndex];
        // Verify answer locally using correctAnswer from question object
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        setAnsweredQuestions(prev => [...prev, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            userAnswer: selectedAnswer,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect
        }]);

        if (isCorrect) setScore(prevScore => prevScore + 4);
        else setScore(prevScore => prevScore - 1);

        nextQuestion();
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            setIsQuizFinished(true);
        }
    };

    const skipQuestion = () => {
        // Track skipped question
        const currentQuestion = questions[currentQuestionIndex];
        setAnsweredQuestions(prev => [...prev, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            userAnswer: null,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: false
        }]);
        nextQuestion();
    };

    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setIsQuizFinished(false);
        setTimeLeftLocal(300);
        setAnsweredQuestions([]);
        setShowReview(false);
    };

    const handleShowReview = () => {
        setShowReview(true);
    };

    const handleBackToScore = () => {
        setShowReview(false);
    };

    if (isQuizFinished) {
        if (showReview) {
            return <Review 
                answeredQuestions={answeredQuestions} 
                onBack={handleBackToScore}
                onRetry={handleRetry}
            />;
        }
        return <Score 
            score={score} 
            totalQuestions={totalQuestions} 
            onReview={handleShowReview}
            onRetry={handleRetry}
        />;
    }

    if (loading) return <div>Loading questions...</div>;

    return (
        <div className="quiz-container">
            {/* Timer moved to header */}
            <div className="question-counter">
                Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            {questions.length > 0 && (
                <Question 
                    question={questions[currentQuestionIndex]} 
                    onAnswer={handleAnswer} 
                    onSkip={skipQuestion} 
                />
            )}
        </div>
    );
};

export default Quiz;