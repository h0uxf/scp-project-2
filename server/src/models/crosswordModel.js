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
            
            const updateData = {
                updatedAt: new Date(),
            };

            if (currentGrid !== undefined) updateData.currentGrid = currentGrid;
            if (timeSpent !== undefined) updateData.timeSpent = parseInt(timeSpent, 10);
            if (hintsUsed !== undefined) updateData.hintsUsed = parseInt(hintsUsed, 10);
            if (score !== undefined) updateData.score = parseInt(score, 10);
            
            if (isCompleted !== undefined && isCompleted) {
                updateData.isCompleted = true;
                updateData.completedAt = new Date();
            }

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

            return progress;
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
            const { title, difficulty, gridSize, isPublished } = puzzleData;
            
            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (difficulty !== undefined) updateData.difficulty = difficulty;
            if (gridSize !== undefined) updateData.gridSize = parseInt(gridSize, 10);
            if (isPublished !== undefined) updateData.isPublished = isPublished;
            updateData.updatedAt = new Date();

            const puzzle = await prisma.crosswordPuzzle.update({
                where: { puzzleId: id },
                data: updateData,
                select: {
                    puzzleId: true,
                    title: true,
                    difficulty: true,
                    gridSize: true,
                    isPublished: true,
                    updatedAt: true,
                },
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
    readAllWords: async () => {
        try {
            const words = await prisma.word.findMany({
                select: {
                    wordId: true,
                    wordText: true,
                    wordLength: true,
                    difficulty: true,
                    category: true,
                    createdAt: true,
                },
                orderBy: { wordText: 'asc' },
            });

            return words;
        } catch (error) {
            throw error;
        }
    },

    readAllClues: async () => {
        try {
            const clues = await prisma.clue.findMany({
                select: {
                    clueId: true,
                    clueText: true,
                    clueType: true,
                    difficulty: true,
                    category: true,
                    createdAt: true,
                },
                orderBy: { clueText: 'asc' },
            });

            return clues;
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
};
