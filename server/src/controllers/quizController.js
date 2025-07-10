const logger = require("../logger.js");
const quizModel = require("../models/quizModel.js");

module.exports = {
  // Player quiz endpoints
  getAllQuizQuestions: async (req, res) => {
    try {
      const quizQuestions = await quizModel.readAllQuizQuestions();
      logger.debug("Fetching all quiz questions");
      res.status(200).json(quizQuestions);
    } catch (error) {
      logger.error(`Fetch all quiz questions failed: ${error.message}`);
      if (error.message.includes("No quiz questions found")) {
        logger.warn("No quiz questions found");
        return res.status(404).json({ error: "No quiz questions found." });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  getQuizQuestionById: async (req, res) => {
    const { questionId } = req.params;
    if (!questionId) {
      logger.warn("Fetch quiz question by ID failed: Missing question ID");
      return res.status(400).json({ message: "Question ID is required" });
    }
    try {
      const quizQuestion = await quizModel.readQuizQuestionById(questionId);
      if (!quizQuestion) {
        logger.warn(`Quiz question with ID ${questionId} not found`);
        return res.status(404).json({ message: "Quiz question not found" });
      }
      logger.debug(`Fetching quiz question with ID ${questionId}`);
      res.status(200).json(quizQuestion);
    } catch (error) {
      logger.error(`Fetch quiz question by ID failed: ${error.message}`);
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: `Quiz question with id ${questionId} not found.` });
      }
      res.status(500).json({ error: error.message });
    }
  },

  submitQuizAndCalculatePersonality: async (req, res) => {
    const { answers } = req.body;
    const userId = res.locals.user_id;

    if (!Array.isArray(answers) || answers.length === 0) {
      logger.warn("Submit quiz answers failed: Answers must be a non-empty array");
      return res.status(400).json({ message: "Answers must be a non-empty array" });
    }
    if (!userId) {
      logger.warn("Submit quiz answers failed: Missing user ID");
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      const personalityResults = await quizModel.calculatePersonalityFromAnswers(answers, userId);
      if (!personalityResults) {
        logger.warn("No personality determined from provided answers");
        return res.status(404).json({ message: "No personality determined from provided answers" });
      }
      logger.info(`Calculated personality for user ID ${userId}`);
      res.status(200).json(personalityResults);
    } catch (error) {
      logger.error(`Error calculating personality: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },

  // Admin quiz endpoints
  createQuizQuestion: async (req, res) => {
    const { questionText, options } = req.body;

    if (!questionText || !Array.isArray(options) || options.length === 0) {
      logger.warn("Create quiz question failed: Missing question text or options");
      return res.status(400).json({ message: "Question text and options are required" });
    }

    try {
      const newQuestion = await quizModel.createQuizQuestion({ questionText, options });
      logger.info(`Quiz question created with ID ${newQuestion.questionId || newQuestion.id}`);
      res.status(201).json(newQuestion);
    } catch (error) {
      logger.error(`Create quiz question failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },

  updateQuizQuestionById: async (req, res) => {
    const { questionId } = req.params;
    const { questionText, options } = req.body;

    if (!questionId || !questionText || !Array.isArray(options) || options.length === 0) {
      logger.warn("Update quiz question failed: Missing question ID, text or options");
      return res.status(400).json({ message: "Question ID, text, and options are required" });
    }

    try {
      const updatedQuestion = await quizModel.updateQuizQuestion(questionId, { questionText, options });
      logger.info(`Quiz question with ID ${questionId} updated`);
      res.status(200).json(updatedQuestion);
    } catch (error) {
      logger.error(`Update quiz question failed: ${error.message}`);
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: `Quiz question with id ${questionId} not found.` });
      }
      res.status(500).json({ error: error.message });
    }
  },

  deleteQuizQuestionById: async (req, res) => {
    const { questionId } = req.params;

    if (!questionId) {
      logger.warn("Delete quiz question failed: Missing question ID");
      return res.status(400).json({ message: "Question ID is required" });
    }

    try {
      const deletedQuestion = await quizModel.deleteQuizQuestion(questionId);
      if (!deletedQuestion) {
        logger.warn(`Quiz question with ID ${questionId} not found`);
        return res.status(404).json({ message: "Quiz question not found" });
      }
      logger.info(`Quiz question with ID ${questionId} deleted`);
      res.status(200).json({ message: "Quiz question deleted successfully" });
    } catch (error) {
      logger.error(`Delete quiz question failed: ${error.message}`);
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: `Quiz question with id ${questionId} not found.` });
      }
      res.status(500).json({ error: error.message });
    }
  },
};