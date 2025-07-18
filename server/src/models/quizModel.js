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

      const userExists = await prisma.user.findUnique({ where: { userId } });
      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist.`);
      }

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
  findQuestionsByIds: async (questionIds) => {
    return await prisma.question.findMany({
      where: questionIds.length > 0 ? { questionId: { in: questionIds } } : {},
      include: { options: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  },

  findQuestionById: async (questionId) => {
    return await prisma.question.findUnique({
      where: { questionId: parseInt(questionId, 10) },
      include: { options: { orderBy: { order: 'asc' } } },
    });
  },

  reorderQuizQuestions: async (questionIds) => {
    try {
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        throw new Error('Question IDs must be a non-empty array.');
      }

      // Validate integer IDs
      const parsedIds = questionIds.map(id => parseInt(id, 10));
      if (parsedIds.some(id => isNaN(id))) {
        throw new Error('All question IDs must be integers.');
      }

      // Verify all questionIds exist
      const existingQuestions = await prisma.question.findMany({
        where: { questionId: { in: parsedIds } },
        include: { options: { orderBy: { order: 'asc' } } },
      });
      if (existingQuestions.length !== questionIds.length) {
        throw new Error('One or more question IDs not found.');
      }

      // Update order in a transaction
      const updatedQuestions = await prisma.$transaction(
        parsedIds.map((id, index) =>
          prisma.question.update({
            where: { questionId: id },
            data: { order: index + 1 },
            include: { options: { orderBy: { order: 'asc' } } },
          })
        )
      );

      // Normalize to 3 options
      return updatedQuestions.map((question) => ({
        ...question,
        questionId: question.questionId,
        options: question.options
          .slice(0, 3)
          .map((opt) => ({
            optionId: opt.optionId,
            optionText: opt.optionText || '',
            personalityId: opt.personalityId,
          }))
          .concat(
            Array(3 - question.options.length)
              .fill()
              .map(() => ({ optionId: null, optionText: '', personalityId: null }))
          )
          .slice(0, 3),
      }));
    } catch (error) {
      throw new Error(`Failed to reorder questions: ${error.message}`);
    }
  },

  reorderQuizOptionsById: async (questionId, optionIds) => {
    try {
      if (!questionId || !Array.isArray(optionIds) || optionIds.length !== 3) {
        throw new Error('Question ID and exactly 3 option IDs are required.');
      }

      // Validate integer IDs
      const parsedQuestionId = parseInt(questionId, 10);
      const parsedOptionIds = optionIds.map(id => parseInt(id, 10));
      if (isNaN(parsedQuestionId) || parsedOptionIds.some(id => isNaN(id))) {
        throw new Error('Question ID and option IDs must be integers.');
      }

      // Verify question exists
      const question = await prisma.question.findUnique({
        where: { questionId: parsedQuestionId },
        include: { options: { orderBy: { order: 'asc' } } },
      });
      if (!question) {
        throw new Error(`Question ID ${questionId} not found.`);
      }

      // Verify all optionIds belong to the question
      const existingOptionIds = question.options.map((opt) => opt.optionId);
      if (!parsedOptionIds.every((id) => existingOptionIds.includes(id))) {
        throw new Error('One or more option IDs not found for this question.');
      }

      // Update order in a transaction
      const updatedOptions = await prisma.$transaction(
        parsedOptionIds.map((id, index) =>
          prisma.option.update({
            where: { optionId: id },
            data: { order: index + 1 },
          })
        )
      );

      // Normalize to 3 options
      return updatedOptions
        .slice(0, 3)
        .map((opt) => ({
          optionId: opt.optionId,
          optionText: opt.optionText || '',
          personalityId: opt.personalityId,
        }))
        .concat(
          Array(3 - updatedOptions.length)
            .fill()
            .map(() => ({ optionId: null, optionText: '', personalityId: null }))
        )
        .slice(0, 3);
    } catch (error) {
      throw new Error(`Failed to reorder options: ${error.message}`);
    }
  },

  createQuizQuestion: async (questionText, options) => {
    try {
      if (!questionText || !Array.isArray(options) || options.length !== 3 || options.some((opt) => !opt.optionText)) {
        throw new Error('Question must have exactly 3 non-empty options.');
      }

      const newQuestion = await prisma.question.create({
        data: {
          questionText,
          order: (await prisma.question.count()) + 1,
          options: {
            create: options.map((opt, index) => ({
              optionText: opt.optionText,
              personalityId: opt.personalityId ? parseInt(opt.personalityId, 10) : null,
              order: index + 1,
            })),
          },
        },
        include: { options: { orderBy: { order: 'asc' } } },
      });

      return {
        ...newQuestion,
        questionId: newQuestion.questionId,
        options: newQuestion.options
          .slice(0, 3)
          .map((opt) => ({
            optionId: opt.optionId,
            optionText: opt.optionText || '',
            personalityId: opt.personalityId,
          })),
      };
    } catch (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }
  },

  updateQuizQuestion: async (questionId, questionText, options) => {
    try {
      if (!questionText || !Array.isArray(options) || options.length !== 3 || options.some((opt) => !opt.optionText)) {
        throw new Error('Question must have exactly 3 non-empty options.');
      }

      // Validate integer questionId
      const parsedQuestionId = parseInt(questionId, 10);
      if (isNaN(parsedQuestionId)) {
        throw new Error('Question ID must be an integer.');
      }

      // Delete existing options and create new ones
      await prisma.option.deleteMany({ where: { question: { questionId: parsedQuestionId } } });
      const updatedQuestion = await prisma.question.update({
        where: { questionId: parsedQuestionId },
        data: {
          questionText,
          options: {
            create: options.map((opt, index) => ({
              optionText: opt.optionText,
              personalityId: opt.personalityId ? parseInt(opt.personalityId, 10) : null,
              order: index + 1,
            })),
          },
        },
        include: { options: { orderBy: { order: 'asc' } } },
      });

      if (!updatedQuestion) {
        throw new Error(`Question ID ${questionId} not found.`);
      }

      // Normalize to 3 options
      return {
        ...updatedQuestion,
        questionId: updatedQuestion.questionId,
        options: updatedQuestion.options
          .slice(0, 3)
          .map((opt) => ({
            optionId: opt.optionId,
            optionText: opt.optionText || '',
            personalityId: opt.personalityId,
          }))
          .concat(
            Array(3 - updatedQuestion.options.length)
              .fill()
              .map(() => ({ optionId: null, optionText: '', personalityId: null }))
          )
          .slice(0, 3),
      };
    } catch (error) {
      throw new Error(`Failed to update question: ${error.message}`);
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