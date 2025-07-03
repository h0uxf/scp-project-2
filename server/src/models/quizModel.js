const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
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

    submitQuizAnswerById: async (questionId, optionId, userId) => {
        try {
            const option = await prisma.option.findFirst({
                where: {
                    optionId: optionId,
                    questionId: questionId,
                },
                select: {
                    isCorrect: true,
                    optionText: true,
                    question: {
                        select: {
                            questionText: true,
                        },
                    },
                },
            });

            if (!option) {
                throw new Error(`Option ${optionId} does not exist or does not belong to question ${questionId}.`);
            }

            // Save the result to QuizResult
            const quizResult = await prisma.quizResult.create({
                data: {
                    userId,
                    questionId,
                    optionId,
                    isCorrect: option.isCorrect,
                },
            });

            if (!quizResult) {
                throw new Error('Failed to save quiz result.');
            }

            return {
                questionId,
                optionId,
                correct: option.isCorrect,
                questionText: option.question.questionText,
                optionText: option.optionText,
            };
        } catch (error) {
            throw error;
        }
    }
}