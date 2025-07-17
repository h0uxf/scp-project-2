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
  reorderQuizQuestions: catchAsync(async (req, res, next) => {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      logger.warn('Reorder quiz questions failed: Missing or invalid question IDs');
      return next(new AppError('Question IDs must be a non-empty array', 400));
    }

    // Validate integer IDs
    const parsedIds = questionIds.map(id => parseInt(id, 10));
    if (parsedIds.some(id => isNaN(id))) {
      logger.warn('Reorder quiz questions failed: Non-integer question IDs');
      return next(new AppError('All question IDs must be integers', 400));
    }

    try {
      const reorderedQuestions = await quizModel.reorderQuizQuestions(parsedIds);
      logger.info('Quiz questions reordered successfully');
      res.status(200).json({ status: 'success', data: reorderedQuestions });
    } catch (error) {
      logger.warn(`Failed to reorder quiz questions: ${error.message}`);
      return next(new AppError(error.message, 400));
    }
  }),

  updateQuizQuestion: catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    const { questionText, options } = req.body;

    if (!questionText || !Array.isArray(options) || options.length !== 3 || options.some((opt) => !opt.optionText)) {
      logger.warn(`Update quiz question ${questionId} failed: Invalid question or options`);
      return next(new AppError('Question must have exactly 3 non-empty options', 400));
    }

    // Validate integer optionIds if provided
    if (options.some(opt => opt.optionId && isNaN(parseInt(opt.optionId, 10)))) {
      logger.warn(`Update quiz question ${questionId} failed: Non-integer option IDs`);
      return next(new AppError('Option IDs must be integers', 400));
    }

    try {
      const updatedQuestion = await quizModel.updateQuizQuestion(questionId, questionText, options);
      logger.info(`Quiz question ${questionId} updated successfully`);
      res.status(200).json({ status: 'success', data: updatedQuestion });
    } catch (error) {
      logger.warn(`Update quiz question ${questionId} failed: ${error.message}`);
      return next(new AppError(error.message, 400));
    }
  }),

  createQuizQuestion: catchAsync(async (req, res, next) => {
    const { questionText, options } = req.body;

    if (!questionText || !Array.isArray(options) || options.length !== 3 || options.some((opt) => !opt.optionText)) {
      logger.warn('Create quiz question failed: Invalid question or options');
      return next(new AppError('Question must have exactly 3 non-empty options', 400));
    }

    try {
      const newQuestion = await quizModel.createQuizQuestion(questionText, options);
      logger.info(`Quiz question created successfully`);
      res.status(201).json({ status: 'success', data: newQuestion });
    } catch (error) {
      logger.warn(`Create quiz question failed: ${error.message}`);
      return next(new AppError(error.message, 400));
    }
  }),

  getAllQuizQuestions: catchAsync(async (req, res, next) => {
    try {
      const questions = await quizModel.findQuestionsByIds([]);
      logger.info('Quiz questions fetched successfully');
      res.status(200).json({ status: 'success', data: questions });
    } catch (error) {
      logger.warn(`Failed to fetch quiz questions: ${error.message}`);
      return next(new AppError(error.message, 400));
    }
  }),

  deleteQuizQuestion: catchAsync(async (req, res, next) => {
    const { questionId } = req.params;

    try {
      const question = await quizModel.findQuestionById(questionId);
      if (!question) {
        logger.warn(`Delete quiz question ${questionId} failed: Question not found`);
        return next(new AppError(`Question ID ${questionId} not found`, 404));
      }
      await prisma.question.delete({ where: { questionId: parseInt(questionId, 10) } });
      logger.info(`Quiz question ${questionId} deleted successfully`);
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      logger.warn(`Delete quiz question ${questionId} failed: ${error.message}`);
      return next(new AppError(error.message, 400));
    }
  }),

  reorderQuizOptionsById: catchAsync(async (req, res, next) => {
    const { questionId } = req.params;
    const { optionIds } = req.body;

    if (!questionId || !Array.isArray(optionIds) || optionIds.length !== 3) {
      logger.warn(`Reorder quiz options failed: Invalid question ID ${questionId} or option IDs count (${optionIds?.length})`);
      return next(new AppError('Question ID and exactly 3 option IDs are required', 400));
    }

    // Validate integer IDs
    const parsedOptionIds = optionIds.map(id => parseInt(id, 10));
    if (parsedOptionIds.some(id => isNaN(id))) {
      logger.warn(`Reorder quiz options failed: Non-integer option IDs`);
      return next(new AppError('All option IDs must be integers', 400));
    }

    try {
      const reorderedOptions = await quizModel.reorderQuizOptionsById(questionId, parsedOptionIds);
      logger.info(`Quiz options for question ID ${questionId} reordered successfully`);
      res.status(200).json({ status: 'success', data: reorderedOptions });
    } catch (error) {
      logger.warn(`Failed to reorder options for question ID ${questionId}: ${error.message}`);
      return next(new AppError(error.message, 400));
    }
  }),
};