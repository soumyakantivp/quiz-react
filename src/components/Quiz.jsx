import React, { useState, useEffect } from 'react';
import Question from './Question';
import Timer from './Timer';
import Score from './Score';
import Review from './Review';
import questions from '../data/questions';

const Quiz = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [totalQuestions] = useState(questions.length);
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        if (timeLeft > 0 && !isQuizFinished) {
            const timerId = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
            return () => clearInterval(timerId);
        } else if (timeLeft === 0) {
            setIsQuizFinished(true);
        }
    }, [timeLeft, isQuizFinished]);

    const handleAnswer = (isCorrect, selectedAnswer) => {
        const currentQuestion = questions[currentQuestionIndex];
        
        // Track the answered question
        setAnsweredQuestions(prev => [...prev, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            userAnswer: selectedAnswer,
            correctAnswer: currentQuestion.answer,
            isCorrect: isCorrect
        }]);

        if (isCorrect) {
            setScore(prevScore => prevScore + 4);
        } else {
            setScore(prevScore => prevScore - 1);
        }
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
            correctAnswer: currentQuestion.answer,
            isCorrect: false
        }]);
        nextQuestion();
    };

    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setIsQuizFinished(false);
        setTimeLeft(300);
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

    return (
        <div className="quiz-container">
            <Timer timeLeft={timeLeft} />
            <div className="question-counter">
                Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <Question 
                question={questions[currentQuestionIndex]} 
                onAnswer={handleAnswer} 
                onSkip={skipQuestion} 
            />
        </div>
    );
};

export default Quiz;