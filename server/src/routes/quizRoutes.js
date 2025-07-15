// Goh Yi Xin Karys P2424431 DIT/FT/2A/01
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
    questionValidationRules,
    quizResultValidationRules,
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
    quizController.updateQuizQuestionById
);

router.delete(
    '/:questionId',
    jwtMiddleware.verifyAccessToken,
    verifyRole([3, 4, 5]),
    quizController.deleteQuizQuestionById
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;
