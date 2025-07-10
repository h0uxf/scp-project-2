import React, { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [personalityResult, setPersonalityResult] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/quiz");
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    };

    fetchQuestions();
  }, []);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setAnswers((prev) => [...prev, option.optionText]);
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setQuizCompleted(true);
      calculatePersonality();
    }
  };

  const calculatePersonality = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/quiz/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const result = await response.json();
      setPersonalityResult(result);
    } catch (err) {
      console.error("Error calculating personality:", err);
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

  if (quizCompleted && personalityResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Your Ideal Course</h2>
        <div className="max-w-xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-semibold mb-2 text-purple-300">
            {personalityResult.name}
          </h3>
          <p className="text-lg text-gray-200">{personalityResult.description}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
      <h1 className="text-4xl font-bold mb-8">Find the SoC Diploma best suited for you!</h1>
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
                ${selectedOption?.optionText === opt.optionText
                  ? "bg-purple-700/80 scale-105"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105"}
              `}
              disabled={selectedOption !== null}
            >
              {opt.optionText}
            </button>
          ))}
        </div>

        {selectedOption && (
          <button
            onClick={handleNextQuestion}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
          >
            {currentIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
