const quizModel = require('../models/quizModel.js');

module.exports = {
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

        if (!questionId || !optionId) {
            return res.status(400).json({ message: 'Question ID and Option ID are required' });
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
    }
}