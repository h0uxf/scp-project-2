const quizModel = require('../models/quizModel.js');

module.exports = {
    //Player quiz endpoints
    getAllQuizQuestions: async (req, res) => {
        try {
            const quizQuestions = await quizModel.readAllQuizQuestions();
            res.status(200).json(quizQuestions);
        } catch (error) {
            console.error(`Error fetching quiz questions: ${error}`);
            if (error.message.includes('No quiz questions found')) {
                return res.status(404).json({ error: 'No quiz questions found.' });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    getQuizQuestionById: async (req, res) => {
        const { questionId } = req.params;

        const data = {
            questionId: parseInt(questionId, 10)
        }

        if (!questionId) {
            return res.status(400).json({ message: 'Question ID is required' });
        }

        try {
            const quizQuestion = await quizModel.readQuizQuestionById(questionId);
            if (!quizQuestion) {
                return res.status(404).json({ message: 'Quiz question not found' });
            }
            res.status(200).json(quizQuestion);
        } catch (error) {
            console.error(`Error fetching quiz question by ID: ${error}`);
             if (error.message.includes('Question with ID not found.')) {
                return res.status(404).json({ error: `Quiz question with id ${questionId} found.` });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    submitQuizAnswerById: async (req, res) => {
        const { questionId } = req.params;
        const { optionId } = req.body;
        const userId = res.locals.user_id;

        if (!questionId || !optionId || !userId) {
            return res.status(400).json({ message: 'Question ID, Option ID and user ID are required' });
        }

        try {
            const result = await quizModel.submitQuizAnswerById(questionId, optionId, userId);
            if (!result) {
                return res.status(404).json({ message: 'Quiz question or option not found' });
            }
            res.status(200).json(result);
        } catch (error) {
            console.error(`Error submitting quiz answer: ${error}`);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    //Quiz endpoints for both player and admin
    getQuizResultsByUserId: async (req, res) => {
        const userId = res.locals.user_id;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        try {
            const results = await quizModel.readQuizResultsByUserId(userId);
            res.status(200).json(results);
        } catch (error) {
            console.error(`Error fetching quiz results: ${error}`);
            res.status(500).json({ error: error.message });
        }
    },
    
    //Admin quiz endpoints
    createQuizQuestion: async (req, res) => {
        const { questionText, options } = req.body;

        if (!questionText || !Array.isArray(options) || options.length === 0) {
            return res.status(400).json({ message: 'Question text and options are required' });
        }

        try {
            const newQuestion = await quizModel.createQuizQuestion(questionText, options);
            res.status(201).json(newQuestion);
        } catch (error) {
            console.error(`Error creating quiz question: ${error}`);
            res.status(500).json({ error: error.message });
        }
    },

    updateQuizQuestionById: async (req, res) => {
        const { questionId } = req.params;
        const { questionText, options } = req.body;

        if (!questionId || !questionText || !Array.isArray(options) || options.length === 0) {
            return res.status(400).json({ message: 'Question ID, text, and options are required' });
        }

        try {
            const updatedQuestion = await quizModel.updateQuizQuestion(questionId, questionText, options);
            res.status(200).json(updatedQuestion);
        } catch (error) {
            console.error(`Error updating quiz question: ${error}`);
            if (error.message.includes('Question with ID not found.')) {
                return res.status(404).json({ error: `Quiz question with id ${questionId} found.` });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    deleteQuizQuestionById: async (req, res) => {
        const { questionId } = req.params;

        if (!questionId) {
            return res.status(400).json({ message: 'Question ID is required' });
        }

        try {
            const deletedQuestion = await quizModel.deleteQuizQuestion(questionId);
            if (!deletedQuestion) {
                return res.status(404).json({ message: 'Quiz question not found' });
            }
            res.status(200).json({ message: 'Quiz question deleted successfully' });
        } catch (error) {
            console.error(`Error deleting quiz question: ${error}`);
            if (error.message.includes('Question with ID not found.')) {
                return res.status(404).json({ error: `Quiz question with id ${questionId} found.` });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    getQuizResultsByQuestionId: async (req, res) => {
        const { questionId } = req.params;

        if (!questionId) {
            return res.status(400).json({ message: 'Question ID is required' });
        }

        try {
            const results = await quizModel.readQuizResultsByQuestionId(questionId);
            res.status(200).json(results);
        } catch (error) {
            console.error(`Error fetching quiz results by question ID: ${error}`);
            if (error.message.includes('Question with ID not found.')) {
                return res.status(404).json({ error: `Quiz question with id ${questionId} found.` });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}