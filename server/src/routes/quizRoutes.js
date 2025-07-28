//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');
const prisma = require('@prisma/client'); 

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const quizController = require('../controllers/quizController.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const verifyRole = require('../middlewares/roleMiddleware.js');

//////////////////////////////////////////////////////
// IMPORT MIDDLEWARES FOR INPUT VALIDATION
//////////////////////////////////////////////////////
const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');
const {
    validate,
    questionValidationRules
} = require('../middlewares/validators'); 

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (PLAYER)
//////////////////////////////////////////////////////
router.get('/', quizController.getAllQuizQuestions);

router.get('/:questionId', quizController.getQuizQuestionById);

// [POST] Submit quiz answers and calculate personality for logged-in user
router.post(
    '/submit',
    jwtMiddleware.verifyAccessToken,
    validate,                           
    quizController.submitQuizAndCalculatePersonality
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (CONTENT MANAGER, ADMIN, AND SUPER ADMIN)
//////////////////////////////////////////////////////
router.put(
    '/reorder',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]),
    quizController.reorderQuizQuestions
)

router.post(
    '/',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]),
    questionValidationRules(), 
    validate,                  
    quizController.createQuizQuestion
);

router.put(
    '/:questionId',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]),
    questionValidationRules(), 
    validate,                  
    quizController.updateQuizQuestion
);

router.delete(
    '/:questionId',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]),
    quizController.deleteQuizQuestion
);

router.put(
    '/:questionId/options/reorder',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]),
    quizController.reorderQuizOptionsById
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;
