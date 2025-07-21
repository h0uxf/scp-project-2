// controllers/crosswordController.js
const logger = require("../logger.js");
const crosswordModel = require("../models/crosswordModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
    // Player crossword endpoints
    getAllPuzzles: catchAsync(async (req, res, next) => {
        const puzzles = await crosswordModel.readAllPuzzles();
        if (!puzzles || puzzles.length === 0) {
            logger.warn("No puzzles found");
            return next(new AppError("No puzzles found", 404));
        }
        logger.debug("Fetching all published puzzles");
        res.status(200).json({ status: "success", data: puzzles });
    }),

    getPuzzleById: catchAsync(async (req, res, next) => {
        const { puzzleId } = req.params;
        if (!puzzleId) {
            logger.warn("Fetch puzzle by ID failed: Missing puzzle ID");
            return next(new AppError("Puzzle ID is required", 400));
        }
        const puzzle = await crosswordModel.readPuzzleById(puzzleId);
        if (!puzzle) {
            logger.warn(`Puzzle with ID ${puzzleId} not found`);
            return next(new AppError(`Puzzle with ID ${puzzleId} not found`, 404));
        }
        logger.debug(`Fetching puzzle with ID ${puzzleId}`);
        res.status(200).json({ status: "success", data: puzzle });
    }),

    getUserPuzzleProgress: catchAsync(async (req, res, next) => {
        const { puzzleId } = req.params;
        const userId = res.locals.user_id;

        if (!puzzleId) {
            logger.warn("Get puzzle progress failed: Missing puzzle ID");
            return next(new AppError("Puzzle ID is required", 400));
        }
        if (!userId) {
            logger.warn("Get puzzle progress failed: Missing user ID");
            return next(new AppError("User ID is required", 400));
        }

        const progress = await crosswordModel.readUserPuzzleProgress(userId, puzzleId);
        logger.debug(`Fetching puzzle progress for user ${userId} and puzzle ${puzzleId}`);
        
        if (!progress) {
            // No progress found, return null to indicate puzzle not started
            res.status(200).json({ status: "success", data: null });
        } else {
            res.status(200).json({ status: "success", data: progress });
        }
    }),

    startPuzzle: catchAsync(async (req, res, next) => {
        const { puzzleId } = req.params;
        const userId = res.locals.user_id;

        if (!puzzleId) {
            logger.warn("Start puzzle failed: Missing puzzle ID");
            return next(new AppError("Puzzle ID is required", 400));
        }
        if (!userId) {
            logger.warn("Start puzzle failed: Missing user ID");
            return next(new AppError("User ID is required", 400));
        }

        try {
            const progress = await crosswordModel.createUserPuzzleProgress(userId, puzzleId);
            logger.info(`User ${userId} started puzzle ${puzzleId}`);
            res.status(201).json({ 
                status: "success", 
                message: "Puzzle started successfully",
                data: progress 
            });
        } catch (error) {
            if (error.message.includes('already exists')) {
                logger.warn(`User ${userId} tried to start already started puzzle ${puzzleId}`);
                return next(new AppError("Puzzle already started", 409));
            }
            throw error;
        }
    }),

    updatePuzzleProgress: catchAsync(async (req, res, next) => {
        const { puzzleId } = req.params;
        const userId = res.locals.user_id;
        const { currentGrid, isCompleted, timeSpent, hintsUsed, score } = req.body;

        if (!puzzleId) {
            logger.warn("Update puzzle progress failed: Missing puzzle ID");
            return next(new AppError("Puzzle ID is required", 400));
        }
        if (!userId) {
            logger.warn("Update puzzle progress failed: Missing user ID");
            return next(new AppError("User ID is required", 400));
        }

        const progressData = { currentGrid, isCompleted, timeSpent, hintsUsed, score };
        const progress = await crosswordModel.updateUserPuzzleProgress(userId, puzzleId, progressData);
        
        logger.info(`Updated puzzle progress for user ${userId} and puzzle ${puzzleId}`);
        res.status(200).json({ 
            status: "success", 
            message: "Puzzle progress updated successfully",
            data: progress 
        });
    }),

    // Admin crossword endpoints
    getAllPuzzlesAdmin: catchAsync(async (req, res, next) => {
        const puzzles = await crosswordModel.readAllPuzzlesAdmin();
        logger.debug("Admin fetching all puzzles");
        res.status(200).json({ status: "success", data: puzzles });
    }),

    createPuzzle: catchAsync(async (req, res, next) => {
        const { title, difficulty, gridSize } = req.body;
        const createdBy = res.locals.user_id;

        if (!title || !difficulty || !gridSize) {
            logger.warn("Create puzzle failed: Missing required fields");
            return next(new AppError("Title, difficulty, and gridSize are required", 400));
        }

        const puzzleData = { title, difficulty, gridSize, createdBy };
        const puzzle = await crosswordModel.createPuzzle(puzzleData);
        
        logger.info(`Created new puzzle: ${title} by user ${createdBy}`);
        res.status(201).json({ 
            status: "success", 
            message: "Puzzle created successfully",
            data: puzzle 
        });
    }),

    updatePuzzle: catchAsync(async (req, res, next) => {
        const { puzzleId } = req.params;
        const { title, difficulty, gridSize, isPublished } = req.body;

        if (!puzzleId) {
            logger.warn("Update puzzle failed: Missing puzzle ID");
            return next(new AppError("Puzzle ID is required", 400));
        }

        if (!title && !difficulty && !gridSize && isPublished === undefined) {
            logger.warn("Update puzzle failed: No fields to update");
            return next(new AppError("At least one field is required for update", 400));
        }

        const puzzleData = { title, difficulty, gridSize, isPublished };
        const puzzle = await crosswordModel.updatePuzzle(puzzleId, puzzleData);
        
        logger.info(`Updated puzzle ${puzzleId}`);
        res.status(200).json({ 
            status: "success", 
            message: "Puzzle updated successfully",
            data: puzzle 
        });
    }),

    deletePuzzle: catchAsync(async (req, res, next) => {
        const { puzzleId } = req.params;

        if (!puzzleId) {
            logger.warn("Delete puzzle failed: Missing puzzle ID");
            return next(new AppError("Puzzle ID is required", 400));
        }

        await crosswordModel.deletePuzzle(puzzleId);
        logger.info(`Deleted puzzle ${puzzleId}`);
        res.status(200).json({ 
            status: "success", 
            message: "Puzzle deleted successfully" 
        });
    }),

    // Word and Clue management
    getAllWords: catchAsync(async (req, res, next) => {
        const words = await crosswordModel.readAllWords();
        logger.debug("Fetching all words");
        res.status(200).json({ status: "success", data: words });
    }),

    getAllClues: catchAsync(async (req, res, next) => {
        const clues = await crosswordModel.readAllClues();
        logger.debug("Fetching all clues");
        res.status(200).json({ status: "success", data: clues });
    }),

    createWord: catchAsync(async (req, res, next) => {
        const { wordText, difficulty, category } = req.body;

        if (!wordText) {
            logger.warn("Create word failed: Missing word text");
            return next(new AppError("Word text is required", 400));
        }

        const wordData = { wordText, difficulty, category };
        const word = await crosswordModel.createWord(wordData);
        
        logger.info(`Created new word: ${wordText}`);
        res.status(201).json({ 
            status: "success", 
            message: "Word created successfully",
            data: word 
        });
    }),

    createClue: catchAsync(async (req, res, next) => {
        const { clueText, clueType, difficulty, category } = req.body;

        if (!clueText || !clueType) {
            logger.warn("Create clue failed: Missing required fields");
            return next(new AppError("Clue text and clue type are required", 400));
        }

        const clueData = { clueText, clueType, difficulty, category };
        const clue = await crosswordModel.createClue(clueData);
        
        logger.info(`Created new clue: ${clueText}`);
        res.status(201).json({ 
            status: "success", 
            message: "Clue created successfully",
            data: clue 
        });
    }),
};
