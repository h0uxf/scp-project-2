import React, { useState, useEffect } from "react";
import { HelpCircle, Share2, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";

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
  const { currentUser, hasRole, authLoading } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [personalityResult, setPersonalityResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    options: [{ optionText: "" }, { optionText: "" }, { optionText: "" }, { optionText: "" }],
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Fetch questions or load saved result
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
        const response = await fetch("http://localhost:5000/api/quiz", {
          credentials: "include",
        });
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
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Auto-advance to next question after selecting an option
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
        credentials: "include",
        body: JSON.stringify({ answers }),
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
      toast.success("Quiz completed successfully!");
    } catch (err) {
      console.error("Error calculating personality:", err);
      toast.error(err.message);
    }
  };

  const handleRetakeQuiz = () => {
    localStorage.removeItem("personalityResult");
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setQuizCompleted(false);
    setPersonalityResult(null);
    setIsPreviewMode(false);
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
          toast.error("Failed to share result");
        }
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Result copied to clipboard!");
      }
    }
  };

  // Handle question creation
  const handleCreateQuestion = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newQuestion),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create question");
      }
      const result = await response.json();
      setQuestions([...questions, result.data]);
      setNewQuestion({
        questionText: "",
        options: [{ optionText: "" }, { optionText: "" }, { optionText: "" }, { optionText: "" }],
      });
      toast.success("Question created successfully!");
    } catch (err) {
      console.error("Error creating question:", err);
      toast.error(err.message);
    }
  };

  // Handle question update
  const handleUpdateQuestion = async (questionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newQuestion),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update question");
      }
      const result = await response.json();
      setQuestions(questions.map((q) => (q.questionId === questionId ? result.data : q)));
      setNewQuestion({
        questionText: "",
        options: [{ optionText: "" }, { optionText: "" }, { optionText: "" }, { optionText: "" }],
      });
      setEditingQuestionId(null);
      toast.success("Question updated successfully!");
    } catch (err) {
      console.error("Error updating question:", err);
      toast.error(err.message);
    }
  };

  // Handle question deletion
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/${questionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete question");
      }
      setQuestions(questions.filter((q) => q.questionId !== questionId));
      toast.success("Question deleted successfully!");
    } catch (err) {
      console.error("Error deleting question:", err);
      toast.error(err.message);
    }
  };

  // Handle question reordering
  const handleMoveQuestion = async (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);

    try {
      const response = await fetch("http://localhost:5000/api/quiz/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionIds: newQuestions.map((q) => q.questionId) }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reorder questions");
      }
      toast.success("Question order updated!");
    } catch (err) {
      console.error("Error reordering questions:", err);
      toast.error(err.message);
    }
  };

  // Handle option reordering
  const handleMoveOption = (questionId, optionIndex, direction) => {
    if (questionId === "new") {
      // Handle reordering in the creation form (no API call needed)
      const updatedOptions = [...newQuestion.options];
      const newOptionIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
      if (newOptionIndex < 0 || newOptionIndex >= updatedOptions.length) return;

      [updatedOptions[optionIndex], updatedOptions[newOptionIndex]] = [
        updatedOptions[newOptionIndex],
        updatedOptions[optionIndex],
      ];
      setNewQuestion({ ...newQuestion, options: updatedOptions });
      return;
    }

    // Handle reordering for existing questions
    const questionIndex = questions.findIndex((q) => q.questionId === questionId);
    if (questionIndex === -1) return;

    const newQuestions = [...questions];
    const question = { ...newQuestions[questionIndex] };
    const options = [...question.options];
    const newOptionIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
    if (newOptionIndex < 0 || newOptionIndex >= options.length) return;

    [options[optionIndex], options[newOptionIndex]] = [options[newOptionIndex], options[optionIndex]];
    question.options = options;
    newQuestions[questionIndex] = question;
    setQuestions(newQuestions);

    fetch(`http://localhost:5000/api/quiz/${questionId}/options/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ optionIds: options.map((opt) => opt.optionId) }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(errorData.message || "Failed to reorder options");
          });
        }
        toast.success("Option order updated!");
      })
      .catch((err) => {
        console.error("Error reordering options:", err);
        toast.error(err.message);
      });
  };

  // Handle launching updates
  const handleLaunchUpdates = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/quiz/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to launch updates");
      }
      toast.success("Updates launched successfully!");
    } catch (err) {
      console.error("Error launching updates:", err);
      toast.error(err.message);
    }
  };

  // Handle form input changes
  const handleQuestionInputChange = (e) => {
    setNewQuestion({ ...newQuestion, questionText: e.target.value });
  };

  const handleOptionInputChange = (index, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], optionText: value };
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  // Start editing a question
  const startEditingQuestion = (question) => {
    setEditingQuestionId(question.questionId);
    setNewQuestion({
      questionText: question.questionText,
      options: question.options.map((opt) => ({ optionText: opt.optionText })),
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Diploma Course Finder</h1>
        <p className="text-xl text-gray-300">Loading...</p>
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
                Based on your answers, the {personalityResult[0].name} diploma course is best suited for you.{" "}
                {personalityResult[0].description}
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
            <button
              onClick={() => window.open("https://www.sp.edu.sg/courses/schools/soc#section-2", "_blank")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-all duration-300"
            >
              Explore All Diploma Courses
            </button>
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
        <Toaster position="top-right" />
        <h1 className="text-4xl font-bold mb-8">Discover Your Ideal Diploma Course!</h1>

        {/* Admin Controls */}
        {hasRole(3, 4, 5) && !isPreviewMode && (
          <div className="max-w-3xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Manage Quiz Questions</h2>
              <button
                onClick={() => setIsPreviewMode(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full transition-all duration-300"
              >
                Preview as Visitor
              </button>
            </div>
            {/* Question Creation/Update Form */}
            <div className="mb-6">
              <input
                type="text"
                value={newQuestion.questionText}
                onChange={handleQuestionInputChange}
                placeholder="Enter question text"
                className="w-full bg-white/10 text-white p-3 rounded-lg mb-4"
              />
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={option.optionText}
                    onChange={(e) => handleOptionInputChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full bg-white/10 text-white p-3 rounded-lg"
                  />
                  <button
                    onClick={() => handleMoveOption(editingQuestionId || "new", index, "up")}
                    disabled={index === 0}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50"
                  >
                    <ArrowUp size={20} />
                  </button>
                  <button
                    onClick={() => handleMoveOption(editingQuestionId || "new", index, "down")}
                    disabled={index === newQuestion.options.length - 1}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50"
                  >
                    <ArrowDown size={20} />
                  </button>
                </div>
              ))}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={editingQuestionId ? () => handleUpdateQuestion(editingQuestionId) : handleCreateQuestion}
                  className="bg-green-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all duration-300"
                >
                  {editingQuestionId ? "Update Question" : "Create Question"}
                </button>
                {editingQuestionId && (
                  <button
                    onClick={() =>
                      setNewQuestion({
                        questionText: "",
                        options: [{ optionText: "" }, { optionText: "" }, { optionText: "" }, { optionText: "" }],
                      }) && setEditingQuestionId(null)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full transition-all duration-300"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </div>
            {/* Existing Questions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Existing Questions</h3>
              {questions.map((question, index) => (
                <div
                  key={question.questionId}
                  className="flex justify-between items-center bg-white/10 p-4 rounded-lg mb-2"
                >
                  <span>{question.questionText}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveQuestion(index, "up")}
                      disabled={index === 0}
                      className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50"
                    >
                      <ArrowUp size={20} />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(index, "down")}
                      disabled={index === questions.length - 1}
                      className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50"
                    >
                      <ArrowDown size={20} />
                    </button>
                    <button
                      onClick={() => startEditingQuestion(question)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.questionId)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-all duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Launch Updates Button */}
            <div className="mt-6">
              <button
                onClick={handleLaunchUpdates}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-all duration-300"
              >
                Launch Updates
              </button>
            </div>
          </div>
        )}

        {/* Preview Mode or Visitor View */}
        {(!hasRole(3, 4, 5) || isPreviewMode) && (
          <div className="max-w-3xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
            {hasRole(3, 4, 5) && isPreviewMode && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full transition-all duration-300"
                >
                  Exit Preview Mode
                </button>
              </div>
            )}
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
        )}
      </div>
    </QuizErrorBoundary>
  );
};

export default QuizPage;