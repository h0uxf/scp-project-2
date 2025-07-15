import React, { useState, useEffect } from "react";
import { HelpCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

class QuizErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Diploma Course Finder</h1>
          <p className="text-xl text-red-300">{this.state.errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [personalityResult, setPersonalityResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedResult = localStorage.getItem("personalityResult");
    if (savedResult) {
      setPersonalityResult(JSON.parse(savedResult));
      setQuizCompleted(true);
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/quiz");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch questions");
        }
        const data = await response.json();
        if (data.status !== "success") {
          throw new Error(data.message || "Failed to fetch questions");
        }
        setQuestions(data.data || []);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError("Unable to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedOption !== null) {
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedOption]);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    // Save questionId and optionId in answers array
    setAnswers((prev) => [
      ...prev,
      {
        questionId: questions[currentIndex].questionId,
        optionId: option.optionId,
      },
    ]);
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setQuizCompleted(true);
      await calculatePersonality();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswers((prev) => prev.slice(0, -1));
    }
  };

  const calculatePersonality = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to calculate personality");
      }
      const result = await response.json();
      if (result.status !== "success") {
        throw new Error(result.message || "Failed to calculate personality");
      }
      setPersonalityResult(result.data || []);
      localStorage.setItem("personalityResult", JSON.stringify(result.data || []));
      setError(null);
    } catch (err) {
      console.error("Error calculating personality:", err);
      setError(err.message);
    }
  };

  const handleRetakeQuiz = () => {
    localStorage.removeItem("personalityResult");
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setQuizCompleted(false);
    setPersonalityResult(null);
    setError(null);
    window.location.reload();
  };

  const handleShareResult = async () => {
    if (personalityResult?.length > 0) {
      const shareText = `The Diploma I got is ${personalityResult[0].name}! Take the quiz to find your ideal course in SoC!\n${window.location.origin}/quiz`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "My Diploma Course Recommendation",
            text: shareText,
          });
        } catch (error) {
          console.error("Sharing failed:", error);
        }
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Result copied to clipboard. You can now share it!");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Diploma Course Finder</h1>
        <p className="text-xl text-gray-300">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Diploma Course Finder</h1>
        <p className="text-xl text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (quizCompleted && personalityResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Your Recommended Diploma Course</h2>
        <div className="max-w-xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
          {personalityResult.length > 0 ? (
            <>
              <h3 className="text-2xl font-semibold mb-2 text-purple-300">
                {personalityResult[0].name}
                {personalityResult.length > 1 && " (Tied Result)"}
              </h3>
              <p className="text-lg text-gray-200">
                Based on your answers, the {personalityResult[0].name} diploma course is best suited for you. {personalityResult[0].description}
              </p>
              {personalityResult.length > 1 && (
                <div className="mt-4">
                  <p className="text-lg font-medium text-yellow-400">Other Recommended Diploma Courses:</p>
                  {personalityResult.slice(1).map((result, index) => (
                    <div key={index} className="mt-2">
                      <h4 className="text-lg font-semibold text-purple-300">{result.name}</h4>
                      <p className="text-gray-200">
                        The {result.name} diploma course may also suit you. {result.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-lg text-gray-200">
              No diploma course recommendation could be determined based on your answers.
            </p>
          )}
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <button
              onClick={handleRetakeQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
            >
              Retake Quiz
            </button>
            <Link
              to=""
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-all duration-300"
            >
              Explore All Diploma Courses
            </Link>
            <button
              onClick={handleShareResult}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2"
            >
              <Share2 /> Share Result
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <QuizErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-8">Discover Your Ideal Diploma Course!</h1>
        <div className="max-w-3xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
          <div className="mb-7">
            <div className="text-sm text-gray-300">{`Question ${currentIndex + 1} of ${questions.length}`}</div>
            <div className="w-full bg-white/20 h-2 rounded-full mt-2">
              <div
                className="h-2 bg-purple-500 rounded-full transition-all duration-100"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex justify-center items-center gap-2">
                <HelpCircle className="text-yellow-400" /> {currentQuestion?.questionText || "Question not available"}
              </h2>
              <div className="grid gap-4">
                {currentQuestion?.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    className={`px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300 shadow-md ${
                      selectedOption?.optionId === opt.optionId
                        ? "bg-purple-700/80 scale-105"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105"
                    }`}
                    disabled={selectedOption !== null}
                  >
                    {opt.optionText}
                  </button>
                )) || <p>No options available</p>}
              </div>
              <div className="mt-8 flex justify-center gap-4">
                {currentIndex > 0 && (
                  <button
                    onClick={handlePreviousQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
                  >
                    Previous Question
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </QuizErrorBoundary>
  );
};

export default QuizPage;
