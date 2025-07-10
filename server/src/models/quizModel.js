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

  // Updates quizResult table for personality quiz answers
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

    // Save quiz result 
    await prisma.quizResult.create({
      data: {
        userId,
        questionId: question.questionId,
        optionId: selectedOption.optionId,
      },
    });

    return { success: true };
  },

  // Calculate personality result for a user based on their quiz answers
  calculatePersonalityResult: async (userId) => {
    const results = await prisma.quizResult.findMany({
      where: { userId },
      include: {
        option: {
          select: {
            personalityId: true,
            personality: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (results.length === 0) {
      throw new Error('No quiz answers found for this user.');
    }

    // Count how many times each personality appears
    const counts = {};
    results.forEach(({ option }) => {
      const pId = option.personalityId;
      counts[pId] = (counts[pId] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts));

    // Get all personalities with max score (handle ties)
    const topPersonalityIds = Object.entries(counts)
      .filter(([_, count]) => count === maxCount)
      .map(([pId]) => parseInt(pId));

    // Fetch full personality details for the top results
    const topPersonalities = await prisma.personalityType.findMany({
      where: { id: { in: topPersonalityIds } },
    });

    return topPersonalities;
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
              personalityId: option.personalityId,
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
              where: { optionId: option.optionId || 0 },
              create: {
                optionText: option.optionText,
                personalityId: option.personalityId,
              },
              update: {
                optionText: option.optionText,
                personalityId: option.personalityId,
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
};
