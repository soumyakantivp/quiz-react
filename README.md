# React Quiz Application

This is a simple React quiz application that presents users with a series of questions and tracks their score. The application is designed to be straightforward and user-friendly, making it easy to take quizzes and view results.

## Features

- Displays one question with four options at a time.
- Includes a "Skip Question" button to proceed to the next question.
- Automatically moves to the next question when an answer is selected.
- Displays a countdown timer for the entire quiz.
- Calculates and displays the final score in percentage at the end of the quiz.
- Each correct answer awards 4 marks, while each wrong answer incurs a penalty of -1 mark.
- Pass/fail determination based on a score threshold of 70%.

## Project Structure

```
react-quiz-app
├── public
│   └── index.html
├── src
│   ├── index.jsx
│   ├── App.jsx
│   ├── components
│   │   ├── Quiz.jsx
│   │   ├── Question.jsx
│   │   ├── Timer.jsx
│   │   └── Score.jsx
│   ├── data
│   │   └── questions.js
│   └── styles
│       └── app.css
├── package.json
├── .gitignore
└── README.md
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd react-quiz-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the application:
   ```
   npm start
   ```

5. Open your browser and go to `http://localhost:3000` to view the application.

## Usage

- Start the quiz and answer the questions presented.
- You can skip questions if you're unsure of the answer.
- Keep an eye on the timer to complete the quiz in time.
- At the end of the quiz, your score will be displayed along with a pass/fail message.

## Future Enhancements

- Fetch questions from an external API to provide a wider variety of quizzes.
- Add user authentication to save scores and progress.
- Implement a leaderboard to compare scores with other users.

## License

This project is open-source and available under the MIT License.