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

  submitQuizAnswerById: async (req, res) => {
    const { questionId } = req.params;
    const { optionId } = req.body;
    const userId = res.locals.user_id;

    if (!questionId || !optionId || !userId) {
      logger.warn("Submit quiz answer failed: Missing question ID, option ID or user ID");
      return res.status(400).json({ message: "Question ID, Option ID and user ID are required" });
    }

    try {
      const result = await quizModel.submitQuizAnswerById(questionId, optionId, userId);
      if (!result) {
        logger.warn(`Question ID ${questionId} and option ID ${optionId} not found`);
        return res.status(404).json({ message: "Quiz question or option not found" });
      }
      logger.info(`User ID ${userId} submitted option ${optionId} for question ${questionId}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error submitting quiz answer: ${error.message}`);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getQuizResultsByUserId: async (req, res) => {
    const userId = res.locals.user_id;

    if (!userId) {
      logger.warn("Fetch quiz results failed: Missing user ID");
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      const results = await quizModel.readQuizResultsByUserId(userId);
      logger.debug(`Fetching quiz results for user ID ${userId}`);
      res.status(200).json(results);
    } catch (error) {
      logger.error(`Error fetching quiz results: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
  
  getPersonalityResultByUserId: async (req, res) => {
    const userId = res.locals.user_id;
    if (!userId) {
      logger.warn("Fetch personality result failed: Missing user ID");
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      const personalityResults = await quizModel.calculatePersonalityResult(userId);
      logger.debug(`Fetched personality result for user ID ${userId}`);
      res.status(200).json(personalityResults);
    } catch (error) {
      logger.error(`Error fetching personality result: ${error.message}`);
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

  getQuizResultsByQuestionId: async (req, res) => {
    const { questionId } = req.params;

    if (!questionId) {
      logger.warn("Fetch quiz results by question ID failed: Missing question ID");
      return res.status(400).json({ message: "Question ID is required" });
    }

    try {
      const results = await quizModel.readQuizResultsByQuestionId(questionId);
      logger.debug(`Fetching quiz results for question ID ${questionId}`);
      res.status(200).json(results);
    } catch (error) {
      logger.error(`Fetch quiz results by question ID failed: ${error.message}`);
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: `Quiz question with id ${questionId} not found.` });
      }
      res.status(500).json({ error: error.message });
    }
  },
};
