const { log } = require("winston");
const logger = require("../logger.js");
const quizModel = require("../models/quizModel.js");
const e = require("express");

module.exports = {
  //Player quiz endpoints
  getAllQuizQuestions: async (req, res) => {
    try {
      const quizQuestions = await quizModel.readAllQuizQuestions();
      logger.debug("Fetching all quiz questions");
      res.status(200).json(quizQuestions);
    } catch (error) {
      console.error(`Error fetching quiz questions: ${error}`);
      if (error.message.includes("No quiz questions found")) {
        logger.warn("Fetch all quiz questions failed: No quiz questions found");
        return res.status(404).json({ error: "No quiz questions found." });
      } else {
        logger.error(`Fetch all quiz questions failed: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
    }
  },

  getQuizQuestionById: async (req, res) => {
    const { questionId } = req.params;

    const data = {
      questionId: parseInt(questionId, 10),
    };

    if (!questionId) {
      logger.warn("Fetch quiz question by ID failed: Missing question ID");
      return res.status(400).json({ message: "Question ID is required" });
    }

    try {
      const quizQuestion = await quizModel.readQuizQuestionById(questionId);
      if (!quizQuestion) {
        logger.warn(
          `Fetch quiz question by ID failed: Quiz question with ID ${questionId} not found`
        );
        return res.status(404).json({ message: "Quiz question not found" });
      }
      logger.debug(`Fetching quiz question with ID ${questionId}`);
      res.status(200).json(quizQuestion);
    } catch (error) {
      console.error(`Error fetching quiz question by ID: ${error}`);
      if (error.message.includes("Question with ID not found.")) {
        logger.warn(
          `Fetch quiz question by ID failed: Quiz question with ID ${questionId} not found`
        );
        return res
          .status(404)
          .json({ error: `Quiz question with id ${questionId} found.` });
      } else {
        logger.error(`Fetch quiz question by ID failed: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
    }
  },

  submitQuizAnswerById: async (req, res) => {
    const { questionId } = req.params;
    const { optionId } = req.body;
    const userId = res.locals.user_id;

    if (!questionId || !optionId || !userId) {
      logger.warn(
        "Submit quiz answer failed: Missing question ID, option ID or user ID"
      );
      return res
        .status(400)
        .json({ message: "Question ID, Option ID and user ID are required" });
    }

    try {
      const result = await quizModel.submitQuizAnswerById(
        questionId,
        optionId,
        userId
      );
      if (!result) {
        logger.warn(
          `Submit quiz answer failed: Question ID ${questionId} and option ID ${optionId} not found`
        );
        return res
          .status(404)
          .json({ message: "Quiz question or option not found" });
      } else {
        logger.info(
          `User ID ${userId} submitted option ${optionId} for question ${questionId}`
        );
        res.status(200).json(result);
      }
    } catch (error) {
      logger.error(`Error submitting quiz answer: ${error}`);
      console.error(`Error submitting quiz answer: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //Quiz endpoints for both player and admin
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
      logger.error(`Error fetching quiz results: ${error}`);
      console.error(`Error fetching quiz results: ${error}`);
      res.status(500).json({ error: error.message });
    }
  },

  //Admin quiz endpoints
  createQuizQuestion: async (req, res) => {
    const { questionText, options } = req.body;

    if (!questionText || !Array.isArray(options) || options.length === 0) {
      logger.warn(
        "Create quiz question failed: Missing question text or options"
      );
      return res
        .status(400)
        .json({ message: "Question text and options are required" });
    }

    try {
      const newQuestion = await quizModel.createQuizQuestion(
        questionText,
        options
      );
      logger.info(`Quiz question created with ID ${newQuestion.id}`);
      res.status(201).json(newQuestion);
    } catch (error) {
      console.error(`Error creating quiz question: ${error}`);
      logger.error(`Create quiz question failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },

  updateQuizQuestionById: async (req, res) => {
    const { questionId } = req.params;
    const { questionText, options } = req.body;

    if (
      !questionId ||
      !questionText ||
      !Array.isArray(options) ||
      options.length === 0
    ) {
      logger.warn(
        "Update quiz question failed: Missing question ID, text or options"
      );
      return res
        .status(400)
        .json({ message: "Question ID, text, and options are required" });
    }

    try {
      const updatedQuestion = await quizModel.updateQuizQuestion(
        questionId,
        questionText,
        options
      );
      logger.info(`Quiz question with ID ${questionId} updated`);
      res.status(200).json(updatedQuestion);
    } catch (error) {
      console.error(`Error updating quiz question: ${error}`);
      if (error.message.includes("Question with ID not found.")) {
        logger.warn(
          `Update quiz question failed: Quiz question with ID ${questionId} not found`
        );
        return res
          .status(404)
          .json({ error: `Quiz question with id ${questionId} found.` });
      } else {
        logger.error(`Update quiz question failed: ${error.message}`);
        console.error(`Error updating quiz question: ${error.message}`);
      }
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
        logger.warn(
          `Delete quiz question failed: Quiz question with ID ${questionId} not found`
        );
        return res.status(404).json({ message: "Quiz question not found" });
      } else {
        logger.info(`Quiz question with ID ${questionId} deleted`);
        res.status(200).json({ message: "Quiz question deleted successfully" });
      }
    } catch (error) {
      console.error(`Error deleting quiz question: ${error}`);
      if (error.message.includes("Question with ID not found.")) {
        logger.warn(
          `Delete quiz question failed: Quiz question with ID ${questionId} not found`
        );
        return res
          .status(404)
          .json({ error: `Quiz question with id ${questionId} found.` });
      } else {
        logger.error(`Delete quiz question failed: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
    }
  },

  getQuizResultsByQuestionId: async (req, res) => {
    const { questionId } = req.params;

    if (!questionId) {
      logger.warn(
        "Fetch quiz results by question ID failed: Missing question ID"
      );
      return res.status(400).json({ message: "Question ID is required" });
    }

    try {
      const results = await quizModel.readQuizResultsByQuestionId(questionId);
      logger.debug(`Fetching quiz results for question ID ${questionId}`);
      res.status(200).json(results);
    } catch (error) {
      console.error(`Error fetching quiz results by question ID: ${error}`);
      if (error.message.includes("Question with ID not found.")) {
        logger.warn(
          `Fetch quiz results by question ID failed: Quiz question with ID ${questionId} not found`
        );
        return res
          .status(404)
          .json({ error: `Quiz question with id ${questionId} found.` });
      } else {
        logger.error(
          `Fetch quiz results by question ID failed: ${error.message}`
        );
        return res.status(500).json({ error: error.message });
      }
    }
  },
};
