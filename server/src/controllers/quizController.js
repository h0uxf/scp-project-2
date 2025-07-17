// controllers/quizController.js
const logger = require("../logger.js");
const quizModel = require("../models/quizModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  // Player quiz endpoints
  getAllQuizQuestions: catchAsync(async (req, res, next) => {
    const quizQuestions = await quizModel.readAllQuizQuestions();
    if (!quizQuestions || quizQuestions.length === 0) {
      logger.warn("No quiz questions found");
      return next(new AppError("No quiz questions found", 404));
    }
    logger.debug("Fetching all quiz questions");
    res.status(200).json({ status: "success", data: quizQuestions });
  }),

  getQuizQuestionById: catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    if (!questionId) {
      logger.warn("Fetch quiz question by ID failed: Missing question ID");
      return next(new AppError("Question ID is required", 400));
    }
    const quizQuestion = await quizModel.readQuizQuestionById(questionId);
    if (!quizQuestion) {
      logger.warn(`Quiz question with ID ${questionId} not found`);
      return next(new AppError(`Quiz question with ID ${questionId} not found`, 404));
    }
    logger.debug(`Fetching quiz question with ID ${questionId}`);
    res.status(200).json({ status: "success", data: quizQuestion });
  }),

  submitQuizAndCalculatePersonality: catchAsync(async (req, res, next) => {
    const { answers } = req.body;
    const userId = res.locals.user_id;

    if (!Array.isArray(answers) || answers.length === 0) {
      logger.warn("Submit quiz answers failed: Answers must be a non-empty array");
      return next(new AppError("Answers must be a non-empty array", 400));
    }
    if (!userId) {
      logger.warn("Submit quiz answers failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    const personalityResults = await quizModel.calculatePersonalityFromAnswers(answers, userId);
    if (!personalityResults) {
      logger.warn("No personality determined from provided answers");
      return next(new AppError("No personality determined from provided answers", 404));
    }
    logger.info(`Calculated personality for user ID ${userId}`);
    res.status(200).json({ status: "success", data: personalityResults });
  }),

  // Admin quiz endpoints
  createQuizQuestion: catchAsync(async (req, res, next) => {
    const { questionText, options } = req.body;

    if (!questionText || !Array.isArray(options) || options.length === 0) {
      logger.warn("Create quiz question failed: Missing question text or options");
      return next(new AppError("Question text and options are required", 400));
    }

    const newQuestion = await quizModel.createQuizQuestion({ questionText, options });
    logger.info(`Quiz question created with ID ${newQuestion.questionId || newQuestion.id}`);
    res.status(201).json({ status: "success", data: newQuestion });
  }),

  updateQuizQuestionById: catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    const { questionText, options } = req.body;

    if (!questionId || !questionText || !Array.isArray(options) || options.length === 0) {
      logger.warn("Update quiz question failed: Missing question ID, text, or options");
      return next(new AppError("Question ID, text, and options are required", 400));
    }

    const updatedQuestion = await quizModel.updateQuizQuestion(questionId, { questionText, options });
    if (!updatedQuestion) {
      logger.warn(`Quiz question with ID ${questionId} not found`);
      return next(new AppError(`Quiz question with ID ${questionId} not found`, 404));
    }
    logger.info(`Quiz question with ID ${questionId} updated`);
    res.status(200).json({ status: "success", data: updatedQuestion });
  }),

  deleteQuizQuestionById: catchAsync(async (req, res, next) => {
    const { questionId } = req.params;

    if (!questionId) {
      logger.warn("Delete quiz question failed: Missing question ID");
      return next(new AppError("Question ID is required", 400));
    }

    const deletedQuestion = await quizModel.deleteQuizQuestion(questionId);
    if (!deletedQuestion) {
      logger.warn(`Quiz question with ID ${questionId} not found`);
      return next(new AppError(`Quiz question with ID ${questionId} not found`, 404));
    }
    logger.info(`Quiz question with ID ${questionId} deleted`);
    res.status(200).json({ status: "success", message: "Quiz question deleted successfully" });
  }),

  reorderQuizQuestions: catchAsync(async (req, res, next) => {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      logger.warn("Reorder quiz questions failed: Missing or invalid question IDs");
      return next(new AppError("Question IDs must be a non-empty array", 400));
    }

    const reorderedQuestions = await quizModel.reorderQuizQuestions(questionIds);
    if (!reorderedQuestions) {
      logger.warn("Failed to reorder quiz questions");
      return next(new AppError("Failed to reorder quiz questions", 500));
    }
    logger.info("Quiz questions reordered successfully");
    res.status(200).json({ status: "success", data: reorderedQuestions });
  })
};