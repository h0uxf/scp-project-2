const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    // Player crossword endpoints
    readAllPuzzles: async () => {
        try {
            const puzzles = await prisma.crosswordPuzzle.findMany({
                where: { isPublished: true },
                select: {
                    puzzleId: true,
                    title: true,
                    difficulty: true,
                    gridSize: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            if (puzzles.length === 0) {
                throw new Error('No puzzles found.');
            }

            return puzzles;
        } catch (error) {
            throw error;
        }
    },

    readPuzzleById: async (puzzleId) => {
        const id = parseInt(puzzleId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid puzzle ID. It must be a number.');
        }

        try {
            const puzzle = await prisma.crosswordPuzzle.findUnique({
                where: { puzzleId: id, isPublished: true },
                select: {
                    puzzleId: true,
                    title: true,
                    difficulty: true,
                    gridSize: true,
                    puzzleWords: {
                        select: {
                            startRow: true,
                            startCol: true,
                            direction: true,
                            clueNumber: true,
                            word: {
                                select: {
                                    wordText: true,
                                    wordLength: true,
                                },
                            },
                            clue: {
                                select: {
                                    clueText: true,
                                    clueType: true,
                                },
                            },
                        },
                        orderBy: { clueNumber: 'asc' },
                    },
                },
            });

            if (!puzzle) {
                throw new Error(`Puzzle with ID ${id} not found or not published.`);
            }

            return puzzle;
        } catch (error) {
            throw error;
        }
    },

    readUserPuzzleProgress: async (userId, puzzleId) => {
        const userIdInt = parseInt(userId, 10);
        const puzzleIdInt = parseInt(puzzleId, 10);
        
        if (isNaN(userIdInt) || isNaN(puzzleIdInt)) {
            throw new Error('Invalid user ID or puzzle ID. They must be numbers.');
        }

        try {
            const progress = await prisma.userPuzzleProgress.findUnique({
                where: {
                    userId_puzzleId: {
                        userId: userIdInt,
                        puzzleId: puzzleIdInt,
                    },
                },
                select: {
                    currentGrid: true,
                    isCompleted: true,
                    completedAt: true,
                    timeSpent: true,
                    hintsUsed: true,
                    score: true,
                    startedAt: true,
                    updatedAt: true,
                },
            });

            return progress; // Can be null if not started
        } catch (error) {
            throw error;
        }
    },

    createUserPuzzleProgress: async (userId, puzzleId) => {
        const userIdInt = parseInt(userId, 10);
        const puzzleIdInt = parseInt(puzzleId, 10);
        
        if (isNaN(userIdInt) || isNaN(puzzleIdInt)) {
            throw new Error('Invalid user ID or puzzle ID. They must be numbers.');
        }

        try {
            const progress = await prisma.userPuzzleProgress.create({
                data: {
                    userId: userIdInt,
                    puzzleId: puzzleIdInt,
                },
                select: {
                    currentGrid: true,
                    isCompleted: true,
                    startedAt: true,
                },
            });

            return progress;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new Error('User progress for this puzzle already exists.');
            }
            throw error;
        }
    },

    updateUserPuzzleProgress: async (userId, puzzleId, progressData) => {
        const userIdInt = parseInt(userId, 10);
        const puzzleIdInt = parseInt(puzzleId, 10);
        
        if (isNaN(userIdInt) || isNaN(puzzleIdInt)) {
            throw new Error('Invalid user ID or puzzle ID. They must be numbers.');
        }

        try {
            const { currentGrid, isCompleted, timeSpent, hintsUsed, score } = progressData;
            
            // Get current progress to check if puzzle was already completed
            const currentProgress = await prisma.userPuzzleProgress.findUnique({
                where: {
                    userId_puzzleId: {
                        userId: userIdInt,
                        puzzleId: puzzleIdInt,
                    },
                },
                select: {
                    isCompleted: true,
                    puzzle: {
                        select: {
                            difficulty: true,
                            title: true
                        }
                    }
                }
            });

            const updateData = {
                updatedAt: new Date(),
            };

            if (currentGrid !== undefined) updateData.currentGrid = currentGrid;
            if (timeSpent !== undefined) updateData.timeSpent = parseInt(timeSpent, 10);
            if (hintsUsed !== undefined) updateData.hintsUsed = parseInt(hintsUsed, 10);
            if (score !== undefined) updateData.score = parseInt(score, 10);
            
            // Check if puzzle is being completed for the first time
            const isFirstTimeCompletion = isCompleted && !currentProgress?.isCompleted;
            
            if (isCompleted !== undefined && isCompleted) {
                updateData.isCompleted = true;
                updateData.completedAt = new Date();
            }

            // Use transaction for atomic updates
            const result = await prisma.$transaction(async (prisma) => {
                // Update puzzle progress
                const progress = await prisma.userPuzzleProgress.update({
                    where: {
                        userId_puzzleId: {
                            userId: userIdInt,
                            puzzleId: puzzleIdInt,
                        },
                    },
                    data: updateData,
                    select: {
                        currentGrid: true,
                        isCompleted: true,
                        completedAt: true,
                        timeSpent: true,
                        hintsUsed: true,
                        score: true,
                        updatedAt: true,
                    },
                });

                // If puzzle is completed for the first time, add rewards
                if (isFirstTimeCompletion && currentProgress?.puzzle) {
                    const difficulty = currentProgress.puzzle.difficulty.toLowerCase();
                    let points = 0;
                    
                    // Assign points based on difficulty
                    switch (difficulty) {
                        case 'easy':
                            points = 5;
                            break;
                        case 'medium':
                            points = 10;
                            break;
                        case 'hard':
                            points = 15;
                            break;
                        default:
                            points = 5; // Default to easy points
                    }

                    // Find or create crossword activity
                    let crosswordActivity = await prisma.activity.findFirst({
                        where: {
                            name: 'Crossword Puzzle'
                        }
                    });

                    if (!crosswordActivity) {
                        crosswordActivity = await prisma.activity.create({
                            data: {
                                name: 'Crossword Puzzle',
                                description: 'Complete crossword puzzles to earn points'
                            }
                        });
                    }

                    // Add user activity record (use upsert to avoid duplicates)
                    await prisma.userActivities.upsert({
                        where: {
                            userId_activityId: {
                                userId: userIdInt,
                                activityId: crosswordActivity.activityId
                            }
                        },
                        create: {
                            userId: userIdInt,
                            activityId: crosswordActivity.activityId,
                            points: points
                        },
                        update: {
                            points: { increment: points },
                            updatedAt: new Date()
                        }
                    });

                    // Update user's total points
                    await prisma.user.update({
                        where: { userId: userIdInt },
                        data: {
                            points: { increment: points }
                        }
                    });
                }

                return progress;
            });

            return result;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('User progress for this puzzle not found.');
            }
            throw error;
        }
    },

    // Admin crossword endpoints
    readAllPuzzlesAdmin: async () => {
        try {
            const puzzles = await prisma.crosswordPuzzle.findMany({
                select: {
                    puzzleId: true,
                    title: true,
                    difficulty: true,
                    gridSize: true,
                    isPublished: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            puzzleWords: true,
                            userProgress: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return puzzles;
        } catch (error) {
            throw error;
        }
    },

    readPuzzleByIdAdmin: async (puzzleId) => {
        const id = parseInt(puzzleId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid puzzle ID. It must be a number.');
        }

        try {
            const puzzle = await prisma.crosswordPuzzle.findUnique({
                where: { puzzleId: id },
                select: {
                    puzzleId: true,
                    title: true,
                    difficulty: true,
                    gridSize: true,
                    isPublished: true,
                    createdAt: true,
                    puzzleWords: {
                        select: {
                            startRow: true,
                            startCol: true,
                            direction: true,
                            clueNumber: true,
                            wordId: true,
                            clueId: true,
                            word: {
                                select: {
                                    wordId: true,
                                    wordText: true,
                                    wordLength: true,
                                },
                            },
                            clue: {
                                select: {
                                    clueId: true,
                                    clueText: true,
                                    clueType: true,
                                },
                            },
                        },
                    },
                },
            });

            return puzzle;
        } catch (error) {
            throw error;
        }
    },

    createPuzzle: async (puzzleData) => {
        try {
            const { title, difficulty, gridSize, createdBy } = puzzleData;
            
            const puzzle = await prisma.crosswordPuzzle.create({
                data: {
                    title,
                    difficulty,
                    gridSize: parseInt(gridSize, 10),
                    createdBy: createdBy ? parseInt(createdBy, 10) : null,
                },
                select: {
                    puzzleId: true,
                    title: true,
                    difficulty: true,
                    gridSize: true,
                    isPublished: true,
                    createdAt: true,
                },
            });

            return puzzle;
        } catch (error) {
            throw error;
        }
    },

    updatePuzzle: async (puzzleId, puzzleData) => {
        const id = parseInt(puzzleId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid puzzle ID. It must be a number.');
        }

        try {
            const { title, difficulty, gridSize, isPublished, puzzleWords } = puzzleData;
            
            // Build update data for basic properties
            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (difficulty !== undefined) updateData.difficulty = difficulty;
            if (gridSize !== undefined) updateData.gridSize = parseInt(gridSize, 10);
            if (isPublished !== undefined) updateData.isPublished = isPublished;
            updateData.updatedAt = new Date();

            // Use transaction to handle both puzzle update and words
            const puzzle = await prisma.$transaction(async (prisma) => {
                // Update basic puzzle properties
                const updatedPuzzle = await prisma.crosswordPuzzle.update({
                    where: { puzzleId: id },
                    data: updateData,
                });

                // Handle puzzle words if provided
                if (puzzleWords && Array.isArray(puzzleWords)) {
                    // Delete existing puzzle words
                    await prisma.puzzleWord.deleteMany({
                        where: { puzzleId: id }
                    });

                    // Insert new puzzle words
                    if (puzzleWords.length > 0) {
                        const puzzleWordData = puzzleWords.map(pw => ({
                            puzzleId: id,
                            wordId: parseInt(pw.wordId),
                            clueId: parseInt(pw.clueId),
                            startRow: parseInt(pw.startRow),
                            startCol: parseInt(pw.startCol),
                            direction: pw.direction.toUpperCase(),
                            clueNumber: parseInt(pw.clueNumber)
                        }));

                        await prisma.puzzleWord.createMany({
                            data: puzzleWordData
                        });
                    }
                }

                // Return updated puzzle with words
                return await prisma.crosswordPuzzle.findUnique({
                    where: { puzzleId: id },
                    select: {
                        puzzleId: true,
                        title: true,
                        difficulty: true,
                        gridSize: true,
                        isPublished: true,
                        updatedAt: true,
                        puzzleWords: {
                            select: {
                                wordId: true,
                                clueId: true,
                                startRow: true,
                                startCol: true,
                                direction: true,
                                clueNumber: true,
                                word: {
                                    select: {
                                        wordText: true,
                                        wordLength: true
                                    }
                                },
                                clue: {
                                    select: {
                                        clueText: true,
                                        clueType: true
                                    }
                                }
                            }
                        }
                    }
                });
            });

            return puzzle;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error(`Puzzle with ID ${puzzleId} not found.`);
            }
            throw error;
        }
    },

    deletePuzzle: async (puzzleId) => {
        const id = parseInt(puzzleId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid puzzle ID. It must be a number.');
        }

        try {
            const puzzle = await prisma.crosswordPuzzle.delete({
                where: { puzzleId: id },
            });

            return puzzle;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error(`Puzzle with ID ${puzzleId} not found.`);
            }
            throw error;
        }
    },

    // Word and Clue management
    readAllWords: async (page = 1, limit = 10) => {
        try {
            const skip = (page - 1) * limit;
            
            const [words, totalCount] = await Promise.all([
                prisma.word.findMany({
                    select: {
                        wordId: true,
                        wordText: true,
                        wordLength: true,
                        difficulty: true,
                        category: true,
                        createdAt: true,
                    },
                    orderBy: { wordText: 'asc' },
                    skip,
                    take: limit,
                }),
                prisma.word.count()
            ]);

            return {
                words,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                hasNextPage: skip + limit < totalCount,
                hasPrevPage: page > 1
            };
        } catch (error) {
            throw error;
        }
    },

    readAllClues: async (page = 1, limit = 10) => {
        try {
            const skip = (page - 1) * limit;
            
            const [clues, totalCount] = await Promise.all([
                prisma.clue.findMany({
                    select: {
                        clueId: true,
                        clueText: true,
                        clueType: true,
                        difficulty: true,
                        category: true,
                        createdAt: true,
                    },
                    orderBy: { clueText: 'asc' },
                    skip,
                    take: limit,
                }),
                prisma.clue.count()
            ]);

            return {
                clues,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                hasNextPage: skip + limit < totalCount,
                hasPrevPage: page > 1
            };
        } catch (error) {
            throw error;
        }
    },

    createWord: async (wordData) => {
        try {
            const { wordText, difficulty, category } = wordData;
            
            const word = await prisma.word.create({
                data: {
                    wordText: wordText.toUpperCase(),
                    wordLength: wordText.length,
                    difficulty,
                    category,
                },
                select: {
                    wordId: true,
                    wordText: true,
                    wordLength: true,
                    difficulty: true,
                    category: true,
                    createdAt: true,
                },
            });

            return word;
        } catch (error) {
            throw error;
        }
    },

    createClue: async (clueData) => {
        try {
            const { clueText, clueType, difficulty, category } = clueData;
            
            const clue = await prisma.clue.create({
                data: {
                    clueText,
                    clueType,
                    difficulty,
                    category,
                },
                select: {
                    clueId: true,
                    clueText: true,
                    clueType: true,
                    difficulty: true,
                    category: true,
                    createdAt: true,
                },
            });

            return clue;
        } catch (error) {
            throw error;
        }
    },

    updateWord: async (wordId, wordData) => {
        try {
            const { wordText, difficulty, category } = wordData;
            
            const word = await prisma.word.update({
                where: { wordId: parseInt(wordId, 10) },
                data: {
                    wordText: wordText.toUpperCase(),
                    wordLength: wordText.length,
                    difficulty,
                    category,
                    updatedAt: new Date(),
                },
                select: {
                    wordId: true,
                    wordText: true,
                    wordLength: true,
                    difficulty: true,
                    category: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return word;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Word not found');
            }
            throw error;
        }
    },

    deleteWord: async (wordId) => {
        try {
            await prisma.word.delete({
                where: { wordId: parseInt(wordId, 10) },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Word not found');
            }
            throw error;
        }
    },

    updateClue: async (clueId, clueData) => {
        try {
            const { clueText, clueType, difficulty, category } = clueData;
            
            const clue = await prisma.clue.update({
                where: { clueId: parseInt(clueId, 10) },
                data: {
                    clueText,
                    clueType,
                    difficulty,
                    category,
                    updatedAt: new Date(),
                },
                select: {
                    clueId: true,
                    clueText: true,
                    clueType: true,
                    difficulty: true,
                    category: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return clue;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Clue not found');
            }
            throw error;
        }
    },

    deleteClue: async (clueId) => {
        try {
            await prisma.clue.delete({
                where: { clueId: parseInt(clueId, 10) },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Clue not found');
            }
            throw error;
        }
    },
};
