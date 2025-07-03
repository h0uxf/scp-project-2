import React, { useState, useEffect } from "react";
import { HelpCircle, CheckCircle, XCircle } from "lucide-react";

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/quiz");
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    };

    fetchQuestions();
  }, []);

  const handleOptionClick = async (option) => {
    setSelectedOption(option);
    const currentQuestion = questions[currentIndex];

    try {
      const res = await fetch(`/api/quiz/${currentQuestion.questionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: option.optionId }),
      });
      const result = await res.json();

      if (result.correct) {
        setFeedback("correct");
        setScore((prev) => prev + 1);
      } else {
        setFeedback("incorrect");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setFeedback(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Quiz Challenge</h1>
        <p className="text-xl text-gray-300">Questions not created yet! Come back shortly.</p>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="text-white text-center mt-20">
        <h2 className="text-4xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-xl">Your score: {score} / {questions.length}</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
      <h1 className="text-4xl font-bold mb-8">Quiz Challenge</h1>
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-semibold mb-6 flex justify-center items-center gap-2">
          <HelpCircle className="text-yellow-400" />
          {currentQuestion.questionText}
        </h2>
        <div className="grid gap-4">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              className={`px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300 shadow-md
                ${selectedOption?.optionId === opt.optionId ?
                  (feedback === "correct" ? "bg-green-500/80" : "bg-red-500/80") :
                  "bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105"}
              `}
              disabled={selectedOption !== null}
            >
              {opt.optionText}
            </button>
          ))}
        </div>

        {feedback && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xl">
            {feedback === "correct" ? (
              <><CheckCircle className="text-green-400" /> Correct!</>
            ) : (
              <><XCircle className="text-red-400" /> Incorrect</>
            )}
          </div>
        )}

        {selectedOption && (
          <button
            onClick={handleNextQuestion}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
