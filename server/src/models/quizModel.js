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

  calculatePersonalityFromAnswers: async (answers, userId = null) => {
    try {
      if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error('Answers must be a non-empty array.');
      }

      // answers expected as array of { questionId: number, optionId: number }
      const personalityCounts = new Map();

      for (const answer of answers) {
        if (
          typeof answer !== 'object' ||
          typeof answer.questionId !== 'number' ||
          typeof answer.optionId !== 'number'
        ) {
          console.log(`Skipping invalid answer format: ${JSON.stringify(answer)}`);
          continue;
        }

        const option = await prisma.option.findFirst({
          where: {
            questionId: answer.questionId,
            optionId: answer.optionId,
          },
          select: { personalityId: true },
        });

        if (!option) {
          console.log(`No option found for questionId=${answer.questionId} optionId=${answer.optionId}`);
          continue;
        }

        if (option.personalityId !== null) {
          const pId = option.personalityId;
          personalityCounts.set(pId, (personalityCounts.get(pId) || 0) + 1);
          console.log(`Matched personalityId ${pId} for questionId=${answer.questionId} optionId=${answer.optionId}`);
        } else {
          console.log(`No personalityId for questionId=${answer.questionId} optionId=${answer.optionId}`);
        }
      }

      let maxCount = 0;
      let topPersonalityIds = [];
      for (const [id, count] of personalityCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          topPersonalityIds = [id];
        } else if (count === maxCount) {
          topPersonalityIds.push(id);
        }
      }

      console.log(`Top personality IDs: ${topPersonalityIds}, Max count: ${maxCount}`);

      if (topPersonalityIds.length === 0) {
        console.log("No personality determined due to empty counts");
        return [];
      }

      const topPersonalities = await prisma.personalityType.findMany({
        where: { id: { in: topPersonalityIds } },
        select: { id: true, code: true, name: true, description: true },
      });

      if (userId && topPersonalities.length > 0) {
        await prisma.userResult.create({
          data: { userId, personalityId: topPersonalities[0].id },
        });
      }

      return topPersonalities;
    } catch (error) {
      console.error("Error in calculatePersonalityFromAnswers:", error);
      throw error;
    }
  },

  // Admin quiz endpoints
  createQuizQuestion: async (questionData) => {
    try {
      const { questionText, options } = questionData;

      if (!options || options.length === 0) {
        throw new Error('At least one option is required.');
      }

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

      if (!options || options.length === 0) {
        throw new Error('At least one option is required.');
      }

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
};