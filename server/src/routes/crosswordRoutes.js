//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const crosswordController = require('../controllers/crosswordController.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const verifyRole = require('../middlewares/roleMiddleware.js');

//////////////////////////////////////////////////////
// IMPORT MIDDLEWARES FOR INPUT VALIDATION
//////////////////////////////////////////////////////
const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');
const { validate } = require('../middlewares/validators'); 

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR CROSSWORD PUZZLES (PLAYER)
//////////////////////////////////////////////////////
// [GET] Get all published puzzles
router.get('/', crosswordController.getAllPuzzles);

// [GET] Get puzzle by ID with clues and words
router.get('/:puzzleId', crosswordController.getPuzzleById);

// [GET] Get user's puzzle progress
router.get(
    '/:puzzleId/progress',
    jwtMiddleware.verifyAccessToken,
    crosswordController.getUserPuzzleProgress
);

// [POST] Start a new puzzle (create initial progress)
router.post(
    '/:puzzleId/start',
    jwtMiddleware.verifyAccessToken,
    validate,
    crosswordController.startPuzzle
);

// [PUT] Update puzzle progress
router.put(
    '/:puzzleId/progress',
    jwtMiddleware.verifyAccessToken,
    validate,
    crosswordController.updatePuzzleProgress
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR CROSSWORD MANAGEMENT (CONTENT MANAGER, ADMIN, AND SUPER ADMIN)
//////////////////////////////////////////////////////
// [GET] Get all puzzles for admin (including unpublished)
router.get(
    '/admin/puzzles',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    crosswordController.getAllPuzzlesAdmin
);

// [POST] Create new puzzle
router.post(
    '/admin/puzzles',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    validate,
    crosswordController.createPuzzle
);

// [PUT] Update puzzle
router.put(
    '/admin/puzzles/:puzzleId',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    validate,
    crosswordController.updatePuzzle
);

// [DELETE] Delete puzzle
router.delete(
    '/admin/puzzles/:puzzleId',
    jwtMiddleware.verifyAccessToken,
    verifyRole([4, 5]), // Admin, Super Admin only
    crosswordController.deletePuzzle
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR WORD AND CLUE MANAGEMENT
//////////////////////////////////////////////////////
// [GET] Get all words
router.get(
    '/admin/words',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    crosswordController.getAllWords
);

// [GET] Get all clues
router.get(
    '/admin/clues',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    crosswordController.getAllClues
);

// [POST] Create new word
router.post(
    '/admin/words',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    validate,
    crosswordController.createWord
);

// [POST] Create new clue
router.post(
    '/admin/clues',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]), // Content Manager, Admin, Super Admin
    validate,
    crosswordController.createClue
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;
