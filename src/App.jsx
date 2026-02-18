import React from 'react';
import Quiz from './components/Quiz';
import './styles/app.css';

const App = () => {
    return (
        <div className="app">
            <h1>React Quiz App</h1>
            <Quiz />
        </div>
    );
};

export default App;