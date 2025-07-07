const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    // Player quiz endpoints
    readAllQuizQuestions: async () => {
        try {
            const quizQuestions = await prisma.question.findMany({
                select: {
                    questionId: true,
                    questionText: true,
                    options: {
                        select: {
                            optionId: true,
                            optionText: true
                        },
                    },
                }
            });

            if (quizQuestions.length === 0) {
                throw new Error('No quiz questions found.');
            }

            return quizQuestions;
        } catch (error) {
            throw error;
        }
    }, 

    readQuizQuestionById: async (questionId) => {
        const id = parseInt(questionId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid question ID. It must be a number.');
        }

        try {
            const quizQuestion = await prisma.question.findUnique({
                where: { questionId: id },
                select: {
                    questionId: true,
                    questionText: true,
                    options: {
                        select: {
                            optionId: true,
                            optionText: true,
                        },
                        orderBy: { optionId: 'asc' }, 
                    },
                },
            });

             if (!quizQuestion) {
                throw new Error(`Question with ID ${id} not found.`);
            }

            return quizQuestion;
        } catch (error) {
            throw error;
        }
    },  

    //Updates quizResult table and userActivities table
    submitQuizAnswerById: async (questionId, optionId, userId) => {
        const question = await prisma.question.findUnique({
            where: { questionId: parseInt(questionId) },
            include: { options: true },
        });

        if (!question) return null;

        const selectedOption = await prisma.option.findUnique({
            where: { optionId: parseInt(optionId) },
        });

        if (!selectedOption || selectedOption.questionId !== question.questionId) {
            return null;
        }

        const isCorrect = selectedOption.isCorrect;

        // Save quiz result
        await prisma.quizResult.create({
            data: {
            userId,
            questionId: question.questionId,
            optionId: selectedOption.optionId,
            isCorrect,
            },
        });

        // Update UserActivities table (assume activityId = fixed value, e.g., 1 for Quiz)
        const activityId = 1;
        const pointsEarned = isCorrect ? 10 : 0;

        await prisma.userActivities.upsert({
            where: {
                userId_activityId: {
                    userId: userId,
                    activityId,
                },
            },
            update: {
                points: { increment: pointsEarned },
                updatedAt: new Date(),
            },
            create: {
                userId: userId,
                activityId,
                points: pointsEarned,
            },
        });

        return { correct: isCorrect };
    },

    // Admin quiz endpoints
    createQuizQuestion: async (questionData) => {
        try {
            const { questionText, options } = questionData;

            const newQuestion = await prisma.question.create({
                data: {
                    questionText,
                    options: {
                        create: options.map(option => ({
                            optionText: option.optionText,
                            isCorrect: option.isCorrect || false,
                        })),
                    },
                },
            });

            return newQuestion;
        } catch (error) {
            throw error;
        }
    },

    updateQuizQuestion: async (questionId, questionData) => {
        try {
            const { questionText, options } = questionData;

            const updatedQuestion = await prisma.question.update({
                where: { questionId: parseInt(questionId, 10) },
                data: {
                    questionText,
                    options: {
                        upsert: options.map(option => ({
                            where: { optionId: option.optionId },
                            create: {
                                optionText: option.optionText,
                                isCorrect: option.isCorrect || false,
                            },
                            update: {
                                optionText: option.optionText,
                                isCorrect: option.isCorrect || false,
                            },
                        })),
                    },
                },
            });

            return updatedQuestion;
        } catch (error) {
            throw error;
        }
    },

    deleteQuizQuestion: async (questionId) => {
        try {
            const deletedQuestion = await prisma.question.delete({
                where: { questionId: parseInt(questionId, 10) },
            });

            return deletedQuestion;
        } catch (error) {
            throw error;
        }
    },

    readQuizResultsByUserId: async (userId) => {
        try {
            const quizResults = await prisma.quizResult.findMany({
                where: { userId: parseInt(userId, 10) },
                include: {
                    question: {
                        select: {
                            questionText: true,
                        },
                    },
                    option: {
                        select: {
                            optionText: true,
                        },
                    },
                },
            });

            if (quizResults.length === 0) {
                throw new Error(`No quiz results found for user ID ${userId}.`);
            }

            return quizResults;
        } catch (error) {
            throw error;
        }
    },

    readQuizResultsByQuestionId: async (questionId) => {
        try {
            const results = await prisma.quizResult.findMany({
                where: { questionId: parseInt(questionId, 10) },
                include: {
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            });

            if (results.length === 0) {
                throw new Error(`No quiz results found for question ID ${questionId}.`);
            }

            return results;
        } catch (error) {
            throw error;
        }
    },
}