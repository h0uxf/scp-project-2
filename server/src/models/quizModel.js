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

  processAndCalculatePersonality: async (answers, userId = null) => {
    try {
      const personalityCounts = new Map(); // Map to store { personalityId: count }
      const quizResultsToStore = []; // Array to collect individual quiz results for batch insertion

      logger.debug(`Starting personality calculation for user ${userId || 'guest'} with ${answers.length} answers.`);

      // 1. Iterate through each submitted optionText to find its details and tally personalities
      for (const optionText of answers) {
        const option = await prisma.option.findFirst({
          where: { optionText: optionText },
          select: {
            optionId: true,        // Needed for QuizResult table
            questionId: true,      // Needed for QuizResult table
            personalityId: true,   // Needed for personality calculation
          },
        });

        if (option) {
          // If the option has an associated personality ID, count it
          if (option.personalityId !== null) {
            const pId = option.personalityId;
            personalityCounts.set(pId, (personalityCounts.get(pId) || 0) + 1);
            logger.debug(`Found personalityId ${pId} for option "${optionText}". Current count: ${personalityCounts.get(pId)}`);
          } else {
            logger.warn(`Option "${optionText}" (ID: ${option.optionId}) has no associated personality type (personalityId is null).`);
          }

          // If a userId is provided and we have all necessary IDs, prepare to store this individual answer
          if (userId && option.questionId && option.optionId) {
            quizResultsToStore.push({
              userId: userId,
              questionId: option.questionId,
              optionId: option.optionId,
            });
            logger.debug(`Prepared quiz result for storage: User ${userId}, Q:${option.questionId}, O:${option.optionId}`);
          } else if (userId) {
              logger.warn(`Could not prepare quiz result for user ${userId} for option "${optionText}" due to missing questionId (${option.questionId}) or optionId (${option.optionId}).`);
          }
        } else {
          logger.warn(`Submitted option text "${optionText}" not found in the database. Skipping.`);
        }
      }

      // 2. Store all collected individual quiz answers in the QuizResult table (in a batch)
      if (quizResultsToStore.length > 0) {
        try {
          await prisma.quizResult.createMany({
            data: quizResultsToStore,
            skipDuplicates: true // Prevents errors if a user somehow submits the same answer twice
          });
          logger.info(`Successfully stored ${quizResultsToStore.length} individual quiz results for user ${userId}.`);
        } catch (storeError) {
          logger.error(`Failed to store individual quiz results for user ${userId}: ${storeError.message}`);
          // Log full stack trace in development for better debugging
          if (process.env.NODE_ENV === 'development') {
            logger.error(storeError.stack);
          }
          // Do not re-throw here; the personality calculation can proceed even if storage fails.
        }
      } else if (userId) {
          logger.info(`No individual quiz results to store for user ${userId} (either no valid options found or userId not provided).`);
      }


      // 3. Determine the dominant personality type based on the counts
      let dominantPersonalityId = null;
      let maxCount = 0;

      // Iterate through the map to find the personality ID with the highest count
      for (const [id, count] of personalityCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          dominantPersonalityId = id;
        }
      }

      if (!dominantPersonalityId) {
        logger.info("No dominant personality found based on the answers that had associated personality types.");
        return null; // Return null if no personality could be determined
      }

      logger.debug(`Dominant personality ID determined: ${dominantPersonalityId} with count ${maxCount}.`);

      // 4. Fetch the full details of the dominant personality type from the database
      const finalPersonality = await prisma.personalityType.findUnique({
        where: { id: dominantPersonalityId },
        select: {
          id: true, // Include ID as it's needed for UserResult storage
          code: true,
          name: true,
          description: true,
        },
      });

      if (!finalPersonality) {
        logger.error(`Dominant personality ID ${dominantPersonalityId} found in counts but not in PersonalityType table.`);
        return null; // Should ideally not happen if data integrity is maintained
      }

      // 5. Optional: Save the final user's calculated personality in the UserResult table
      if (userId) {
        try {
          // Here you might choose to update an existing user result or create a new one.
          // This example creates a new entry. If 'UserResult' should be unique per user,
          // you would need to find and update, or add a unique constraint in your schema.
          await prisma.userResult.create({
            data: {
              userId: userId,
              personalityId: finalPersonality.id,
            },
          });
          logger.info(`Final user result saved for user ${userId} with personality: ${finalPersonality.name}.`);
        } catch (saveFinalResultError) {
          logger.error(`Failed to save final user result for user ${userId}: ${saveFinalResultError.message}`);
          if (process.env.NODE_ENV === 'development') {
            logger.error(saveFinalResultError.stack);
          }
          // The calculation succeeded, so we can proceed even if storing the final result fails.
        }
      }

      return finalPersonality; // Return the full personality object to the controller

    } catch (error) {
      logger.error(`Unhandled error in processAndCalculatePersonality model: ${error.message}`);
      // Log full stack trace in development for better debugging
      if (process.env.NODE_ENV === 'development') {
        logger.error(error.stack);
      }
      throw error; // Re-throw the error to be caught by the controller
    }
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
