import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, Share2, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import BackgroundEffects from "../components/BackgroundEffects";
import { useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";

class QuizErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message || "An unexpected error occurred" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">
            Diploma Course Finder
          </h1>
          <p className="text-lg sm:text-xl text-red-300">
            {this.state.errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
            aria-label="Retry the quiz"
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
  const { currentUser, hasRole, loading } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [personalityResult, setPersonalityResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    options: [
      { optionText: "", personalityId: null },
      { optionText: "", personalityId: null },
      { optionText: "", personalityId: null },
    ],
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const navigate = useNavigate();
  
  // Add ref for the form section
  const formRef = useRef(null);

  const personalityOptions = [
    { id: null, name: "Select Personality" },
    { id: 1, name: "Diploma in Applied AI and Analytics" },
    { id: 2, name: "Diploma in Computer Science" },
    { id: 3, name: "Diploma in Cybersecurity and Digital Forensics" },
  ];

  useEffect(() => {
    if (!loading && !currentUser && window.location.pathname !== "/login") {
      navigate("/login");
    }
  }, [currentUser, loading, navigate]);

  const normalizeOptions = (options) => {
    if (!Array.isArray(options)) {
      return [
        { optionText: "", optionId: null, personalityId: null },
        { optionText: "", optionId: null, personalityId: null },
        { optionText: "", optionId: null, personalityId: null },
      ];
    }
    const normalized = options
      .map((opt) => ({
        optionId: opt.optionId ? parseInt(opt.optionId, 10) : null,
        optionText: opt.optionText || "",
        personalityId: opt.personalityId ? parseInt(opt.personalityId, 10) : null,
      }))
      .filter((opt, index, self) => 
        opt.optionText && 
        self.findIndex(o => o.optionText === opt.optionText) === index
      );
    while (normalized.length < 3) {
      normalized.push({ optionText: "", optionId: null, personalityId: null });
    }
    return normalized.slice(0, 3);
  };

  // Validation function to check for duplicate personalities
  const validatePersonalities = (options) => {
    const selectedPersonalities = options
      .map(opt => opt.personalityId)
      .filter(id => id !== null && id !== undefined);
    
    const uniquePersonalities = [...new Set(selectedPersonalities)];
    return selectedPersonalities.length === uniquePersonalities.length;
  };

  // Function to get duplicate personality names for error message
  const getDuplicatePersonalities = (options) => {
    const personalityCount = {};
    const duplicates = [];
    
    options.forEach(opt => {
      if (opt.personalityId) {
        personalityCount[opt.personalityId] = (personalityCount[opt.personalityId] || 0) + 1;
      }
    });
    
    Object.entries(personalityCount).forEach(([personalityId, count]) => {
      if (count > 1) {
        const personality = personalityOptions.find(p => p.id === parseInt(personalityId));
        if (personality) {
          duplicates.push(personality.name);
        }
      }
    });
    
    return duplicates;
  };

  useEffect(() => {
    if (loading || !currentUser) {
      return;
    }

    const savedResult = localStorage.getItem("personalityResult");
    if (savedResult) {
      setPersonalityResult(JSON.parse(savedResult));
      setQuizCompleted(true);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const data = await makeApiCall("/quiz", "GET");
        if (data.status !== "success") {
          throw new Error(data.message || "Failed to fetch questions");
        }
        const validQuestions = (data.data || [])
          .map((question) => ({
            ...question,
            questionId: parseInt(question.questionId, 10),
            options: normalizeOptions(question.options),
          }))
          .filter(
            (question) =>
              question.questionId &&
              !isNaN(question.questionId) &&
              question.questionText
          );
        setQuestions(validQuestions);
        if (validQuestions.length === 0 && data.data?.length > 0) {
          toast.error("No valid questions found. Please contact an administrator.");
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        toast.error(`Error fetching questions: ${err.message}`);
        setError(err.message);
      }
    };
    fetchQuestions();
  }, [makeApiCall]);

  useEffect(() => {
    if (selectedOption !== null) {
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedOption]);

  const handleOptionClick = (option) => {
    if (!option?.optionId) {
      toast.error("Invalid option selected");
      return;
    }
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
      setSelectedOption(null);
    }
  };

  const calculatePersonality = async () => {
    try {
      // CSRF-protected POST request
      const data = await makeApiCall("/quiz/submit", "POST", { answers });
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to calculate personality");
      }
      setPersonalityResult(data.data || []);
      localStorage.setItem("personalityResult", JSON.stringify(data.data || []));
      setCurrentIndex(0); // Reset currentIndex to prevent showing last question
      setSelectedOption(null); // Reset selected option
      toast.success("Quiz completed successfully!");
    } catch (err) {
      console.error("Error calculating personality:", err);
      toast.error(`Error calculating personality: ${err.message}`);
      setError(err.message);
    }
  };

  const handleRetakeQuiz = () => {
    if (window.confirm("Are you sure you want to retake the quiz? Your current results will be lost.")) {
      localStorage.removeItem("personalityResult");
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswers([]);
      setQuizCompleted(false);
      setPersonalityResult(null);
    }
  };

  const handleShareResult = async () => {
    if (!personalityResult || !Array.isArray(personalityResult) || personalityResult.length === 0) {
      toast.error("No valid result available to share. Please complete the quiz first.", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
      return;
    }

    const shareText = `The Diploma I got is ${personalityResult[0].name}! Take the quiz to find your ideal course in SoC!\n${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Diploma Course Recommendation",
          text: shareText, // This includes both message and URL
          // Remove the separate url parameter to avoid conflicts
        });
        toast.success("Result shared successfully!", {
          style: { fontSize: "14px", padding: "8px 16px" },
        });
      } catch (error) {
        console.error("Web Share API failed:", error);
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          toast.success("Result copied to clipboard!", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
        } catch (clipboardError) {
          console.error("Clipboard API also failed:", clipboardError);
          toast.error("Failed to share result. Please try copying manually.", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Result copied to clipboard!", {
          style: { fontSize: "14px", padding: "8px 16px" },
        });
      } catch (error) {
        console.error("Clipboard API failed:", error);
        toast.error("Failed to copy result. Please try again.", {
          style: { fontSize: "14px", padding: "8px 16px" },
        });
      }
    } else {
      // Fallback for browsers that don't support clipboard API
      try {
        // Create a temporary textarea element
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success("Result copied to clipboard!", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
        } else {
          throw new Error("Copy command failed");
        }
      } catch (error) {
        console.error("Manual copy failed:", error);
        toast.error("Sharing not supported on this device. Please copy the result manually.", {
          style: { fontSize: "14px", padding: "8px 16px" },
        });
      }
    }
  };
  
  const handleCreateQuestion = async () => {
    if (!newQuestion.questionText || newQuestion.options.some((opt) => !opt.optionText || !opt.personalityId)) {
      toast.error("Please fill in all fields including personality selection for each option");
      return;
    }

    // Validate no duplicate personalities
    if (!validatePersonalities(newQuestion.options)) {
      const duplicates = getDuplicatePersonalities(newQuestion.options);
      toast.error(`Each option must have a different personality. Duplicate found: ${duplicates.join(", ")}`);
      return;
    }

    try {
      // CSRF-protected POST request
      const data = await makeApiCall("/quiz", "POST", newQuestion);
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to create question");
      }
      setQuestions([
        ...questions,
        { ...data.data, options: normalizeOptions(data.data.options) },
      ]);
      setNewQuestion({
        questionText: "",
        options: [
          { optionText: "", personalityId: null },
          { optionText: "", personalityId: null },
          { optionText: "", personalityId: null },
        ],
      });
      toast.success("Question created successfully!");
      setIsPreviewMode(true);
    } catch (err) {
      console.error("Error creating question:", err);
      toast.error(`Error creating question: ${err.message}`);
    }
  };

  const handleUpdateQuestion = async (questionId) => {
    if (!newQuestion.questionText || newQuestion.options.some((opt) => !opt.optionText || !opt.personalityId)) {
      toast.error("Please fill in all fields including personality selection for each option");
      return;
    }

    // Validate no duplicate personalities
    if (!validatePersonalities(newQuestion.options)) {
      const duplicates = getDuplicatePersonalities(newQuestion.options);
      toast.error(`Each option must have a different personality. Duplicate found: ${duplicates.join(", ")}`);
      return;
    }

    try {
      // CSRF-protected PUT request
      const data = await makeApiCall(`/quiz/${questionId}`, "PUT", {
        ...newQuestion,
        options: newQuestion.options.slice(0, 3),
      });
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to update question");
      }
      setQuestions(
        questions.map((q) =>
          q.questionId === questionId
            ? { ...data.data, options: normalizeOptions(data.data.options) }
            : q
        )
      );
      setNewQuestion({
        questionText: "",
        options: [
          { optionText: "", personalityId: null },
          { optionText: "", personalityId: null },
          { optionText: "", personalityId: null },
        ],
      });
      setEditingQuestionId(null);
      toast.success("Question updated successfully!");
      setIsPreviewMode(true);
    } catch (err) {
      console.error("Error updating question:", err);
      toast.error(`Error updating question: ${err.message}`);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      // CSRF-protected DELETE request
      const data = await makeApiCall(`/quiz/${questionId}`, "DELETE");
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to delete question");
      }
      setQuestions(questions.filter((q) => q.questionId !== questionId));
      toast.success("Question deleted successfully!");
    } catch (err) {
      console.error("Error deleting question:", err);
      toast.error(`Error deleting question: ${err.message}`);
    }
  };

  const handleMoveQuestion = async (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];

    const questionIds = newQuestions.map((q) => q.questionId);
    if (questionIds.some((id) => !id || isNaN(parseInt(id, 10)))) {
      toast.error("Cannot reorder questions: Invalid question IDs");
      return;
    }

    try {
      // CSRF-protected PUT request
      const data = await makeApiCall("/quiz/reorder", "PUT", { questionIds });
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to reorder questions");
      }
      setQuestions(
        data.data.map((question) => ({
          ...question,
          questionId: parseInt(question.questionId, 10),
          options: normalizeOptions(question.options),
        }))
      );
      toast.success("Question order updated!");
    } catch (err) {
      console.error("Error reordering questions:", err);
      toast.error(`Error reordering questions: ${err.message}`);
    }
  };

  const handleMoveOption = async (questionId, optionIndex, direction) => {
    if (questionId === "new") {
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

    const questionIndex = questions.findIndex((q) => q.questionId === questionId);
    if (questionIndex === -1) return;

    const newQuestions = [...questions];
    const question = { ...newQuestions[questionIndex] };
    const options = [...question.options];
    const newOptionIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
    if (newOptionIndex < 0 || newOptionIndex >= options.length) return;

    [options[optionIndex], options[newOptionIndex]] = [
      options[newOptionIndex],
      options[optionIndex],
    ];
    question.options = normalizeOptions(options);
    newQuestions[questionIndex] = question;
    setQuestions(newQuestions);

    const optionIds = options.map((opt) => opt.optionId);
    if (optionIds.some((id) => !id || isNaN(parseInt(id, 10)))) {
      toast.error("Cannot reorder options: Invalid option IDs");
      return;
    }

    try {
      // CSRF-protected PUT request
      const data = await makeApiCall(`/quiz/${questionId}/options/reorder`, "PUT", { optionIds });
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to reorder options");
      }
      toast.success("Option order updated!");
    } catch (err) {
      console.error("Error reordering options:", err);
      toast.error(`Error reordering options: ${err.message}`);
    }
  };

  const handleSaveAndPreview = () => {
    if (editingQuestionId) {
      handleUpdateQuestion(editingQuestionId);
    } else {
      handleCreateQuestion();
    }
  };

  const handleQuestionInputChange = (e) => {
    setNewQuestion({ ...newQuestion, questionText: e.target.value });
  };

  const handleOptionInputChange = (index, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], optionText: value };
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const handlePersonalityChange = (index, personalityId) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], personalityId: personalityId ? parseInt(personalityId, 10) : null };
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const getPersonalityName = (personalityId) => {
    const personality = personalityOptions.find((p) => p.id === personalityId);
    return personality ? personality.name : "Unknown";
  };

  const startEditingQuestion = (question) => {
    if (!Array.isArray(question.options)) {
      toast.error("Cannot edit question: Invalid options");
      return;
    }
    setEditingQuestionId(question.questionId);
    setNewQuestion({
      questionText: question.questionText || "",
      options: normalizeOptions(question.options),
    });
    
    // Auto-scroll to the form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  // Consolidated quiz rendering component
  const renderQuizInterface = () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) {
      return (
        <p className="text-sm sm:text-base text-gray-200" aria-live="polite">
          No question available
        </p>
      );
    }

    return (
      <div className="max-w-4xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
        {hasRole("content_manager", "moderator", "admin", "super_admin") && isPreviewMode && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsPreviewMode(false)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
              aria-label="Edit quiz questions"
            >
              <Edit size={16} /> Edit Questions
            </button>
          </div>
        )}
        <div className="mb-4 sm:mb-7">
          <div className="text-xs sm:text-sm text-gray-300">{`Question ${currentIndex + 1} of ${questions.length}`}</div>
          <div className="w-full bg-white/20 h-2 rounded-full mt-2">
            <div
              className="h-2 bg-purple-500 rounded-full transition-all duration-100"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
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
            aria-live="polite"
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex justify-center items-center gap-2">
              <HelpCircle className="text-yellow-400" size={20} />
              {currentQuestion.questionText || "Question not available"}
            </h2>
            <div className="grid gap-3 sm:gap-4">
              {currentQuestion.options?.filter(opt => opt.optionText).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-base sm:text-lg font-medium transition-all duration-300 shadow-md ${
                    selectedOption?.optionId === opt.optionId
                      ? "bg-purple-700/80 scale-105"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105"
                  }`}
                  disabled={selectedOption !== null}
                  aria-label={`Select option ${i + 1}: ${opt.optionText}`}
                >
                  {opt.optionText}
                </button>
              )) || (
                <p className="text-sm sm:text-base" aria-live="polite">
                  No options available
                </p>
              )}
            </div>
            <div className="mt-6 sm:mt-8 flex justify-center gap-2 sm:gap-4 flex-wrap">
              {currentIndex > 0 && (
                <button
                  onClick={handlePreviousQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
                  aria-label="Go to previous question"
                >
                  Previous Question
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">
          Diploma Course Finder
        </h1>
        <p className="text-lg sm:text-xl text-gray-300" aria-live="polite">Loading...</p>
      </div>
    );
  }

  if (error || apiError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">
          Diploma Course Finder
        </h1>
        <p className="text-lg sm:text-xl text-red-300" aria-live="polite">{error || apiError}</p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
          aria-label="Retry the quiz"
        >
          Retry
        </button>
      </div>
    );
  }

  if (quizCompleted && personalityResult) {
    return (
      <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
        <BackgroundEffects />
        <QuizErrorBoundary>
          <div className="py-8 px-4 sm:px-6 text-white text-center">
            <Toaster position="top-right" />
            <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8">
              Discover Your Ideal Diploma Course!
            </h1>
            <div className="max-w-2xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
                Your Recommended Diploma Course
              </h2>
              {personalityResult.length > 0 ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-purple-300" aria-live="polite">
                    {personalityResult[0].name}
                    {personalityResult.length > 1 && " (Tied Result)"}
                  </h3>
                  <p className="text-sm sm:text-lg text-gray-200">
                    Based on your answers, the {personalityResult[0].name} diploma
                    course is best suited for you.{" "}
                    {personalityResult[0].description}
                  </p>
                  {personalityResult.length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm sm:text-lg font-medium text-yellow-400">
                        Other Recommended Diploma Courses:
                      </p>
                      {personalityResult.slice(1).map((result, index) => (
                        <div key={index} className="mt-2">
                          <h4 className="text-base sm:text-lg font-semibold text-purple-300">
                            {result.name}
                          </h4>
                          <p className="text-sm sm:text-base text-gray-200">
                            The {result.name} diploma course may also suit you.{" "}
                            {result.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm sm:text-lg text-gray-200" aria-live="polite">
                  No diploma course recommendation could be determined based on your answers.
                </p>
              )}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={handleRetakeQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
                  aria-label="Retake the quiz"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() =>
                    window.open(
                      "https://www.sp.edu.sg/courses/schools/soc#section-2",
                      "_blank"
                    )
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
                  aria-label="Explore all diploma courses"
                >
                  Explore All Diploma Courses
                </button>
                <button
                  onClick={handleShareResult}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                  aria-label="Share quiz result"
                >
                  <Share2 size={16} /> Share Result
                </button>
              </div>
            </div>
            {/* Only show quiz interface for admins in preview mode */}
            {hasRole("content_manager", "moderator", "admin", "super_admin") && isPreviewMode && !quizCompleted && renderQuizInterface()}
          </div>
        </QuizErrorBoundary>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      <BackgroundEffects />
      <QuizErrorBoundary>
        <div className="py-8 px-4 sm:px-6 text-white text-center">
          <Toaster position="top-right" />
          <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8">
            Discover Your Ideal Diploma Course!
          </h1>
          {hasRole("content_manager", "moderator", "admin", "super_admin") && !isPreviewMode && (
            <div ref={formRef} className="max-w-4xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold">
                  Manage Quiz Questions
                </h2>
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full transition-all duration-300 text-sm sm:text-base"
                  aria-label="Preview quiz as visitor"
                >
                  Preview as Visitor
                </button>
              </div>
              <div className="mb-6">
                <input
                  type="text"
                  value={newQuestion.questionText}
                  onChange={handleQuestionInputChange}
                  placeholder="Enter question text"
                  className="w-full bg-white/10 text-white p-3 rounded-lg mb-4 text-sm sm:text-base placeholder-gray-400"
                  aria-label="Question text"
                />
                {newQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4"
                  >
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={option.optionText}
                        onChange={(e) => handleOptionInputChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="w-full bg-white/10 text-white p-3 rounded-lg text-sm sm:text-base placeholder-gray-400 mb-2"
                        aria-label={`Option ${index + 1}`}
                      />
                      <select
                        value={option.personalityId || ""}
                        onChange={(e) => handlePersonalityChange(index, e.target.value)}
                        className={`w-full bg-white/10 text-white p-3 rounded-lg text-sm sm:text-base border ${
                          !validatePersonalities(newQuestion.options) && option.personalityId && 
                          newQuestion.options.filter(opt => opt.personalityId === option.personalityId).length > 1
                            ? 'border-red-500' 
                            : 'border-white/20'
                        }`}
                        aria-label={`Personality for option ${index + 1}`}
                      >
                        {personalityOptions.map((personality) => (
                          <option
                            key={personality.id}
                            value={personality.id || ""}
                            className="bg-slate-800 text-white"
                          >
                            {personality.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleMoveOption(editingQuestionId || "new", index, "up")}
                        disabled={index === 0}
                        className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 min-w-[40px]"
                        aria-label={`Move option ${index + 1} up`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveOption(editingQuestionId || "new", index, "down")}
                        disabled={index === newQuestion.options.length - 1}
                        className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 min-w-[40px]"
                        aria-label={`Move option ${index + 1} down`}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Validation warning for duplicate personalities */}
                {!validatePersonalities(newQuestion.options) && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm">
                      ⚠️ Duplicate personalities detected: {getDuplicatePersonalities(newQuestion.options).join(", ")}
                      <br />Each option must have a different personality selected.
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4">
                  <button
                    onClick={handleSaveAndPreview}
                    disabled={
                      !newQuestion.questionText || 
                      newQuestion.options.some((opt) => !opt.optionText || !opt.personalityId) ||
                      !validatePersonalities(newQuestion.options)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    aria-label={editingQuestionId ? "Update question" : "Create question"}
                  >
                    Save and Preview
                  </button>
                  {editingQuestionId && (
                    <button
                      onClick={() => {
                        setNewQuestion({
                          questionText: "",
                          options: [
                            { optionText: "", personalityId: null },
                            { optionText: "", personalityId: null },
                            { optionText: "", personalityId: null },
                          ],
                        });
                        setEditingQuestionId(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
                      aria-label="Cancel editing"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">
                  Existing Questions
                </h3>
                {questions.map((question, index) => (
                  <div
                    key={question.questionId}
                    className="bg-white/10 p-4 rounded-lg mb-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                      <span className="text-sm sm:text-base mb-2 sm:mb-0 font-medium">
                        {question.questionText}
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleMoveQuestion(index, "up")}
                          disabled={index === 0}
                          className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 min-w-[40px]"
                          aria-label={`Move question ${index + 1} up`}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(index, "down")}
                          disabled={index === questions.length - 1}
                          className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 min-w-[40px]"
                          aria-label={`Move question ${index + 1} down`}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => startEditingQuestion(question)}
                          disabled={!Array.isArray(question.options)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-w-[80px]"
                          aria-label={`Edit question ${index + 1}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.questionId)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-full transition-all duration-300 text-sm sm:text-base min-w-[80px]"
                          aria-label={`Delete question ${index + 1}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 mt-3">
                      <p className="text-xs sm:text-sm text-gray-300 mb-2">Options:</p>
                      {question.options?.filter(opt => opt.optionText).map((option, optIndex) => (
                        <div key={optIndex} className="flex justify-between items-center bg-white/5 p-2 rounded text-xs sm:text-sm">
                          <span>{option.optionText}</span>
                          <span className="text-purple-300 font-medium">
                            → {getPersonalityName(option.personalityId)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!hasRole("content_manager", "moderator", "admin", "super_admin") || isPreviewMode) && renderQuizInterface()}
        </div>
      </QuizErrorBoundary>
    </div>
  );
};

export default QuizPage;