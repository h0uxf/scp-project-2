// Goh Yi Xin Karys P2424431 DIT/FT/2A/01
//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');

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

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest); 

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (PLAYER)
//////////////////////////////////////////////////////
// [GET] Get all quiz questions
router.get(
  '/',
  quizController.getAllQuizQuestions
);  

// [GET] Get quiz question by ID
router.get( 
  '/:questionId',
  quizController.getQuizQuestionById
);

// [POST] Submit quiz answer by question ID
router.post(
  '/:questionId/submit',
  jwtMiddleware.verifyToken,
  quizController.submitQuizAnswerById
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (PLAYER & ADMIN)
//////////////////////////////////////////////////////
// [GET] Get quiz results by user ID
router.get( 
  '/results/user/:userId',
  jwtMiddleware.verifyToken,
  verifyRole([4, 5]), 
  quizController.getQuizResultsByUserId
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (CONTENT MANAGER, ADMIN AND SUPER ADMIN)
//////////////////////////////////////////////////////
// [POST] Create a new quiz question 
router.post(
  '/',
  jwtMiddleware.verifyToken,
  verifyRole([3, 4, 5]), 
  quizController.createQuizQuestion
);

// [PUT] Update a quiz question by ID
router.put(
  '/:questionId',
  jwtMiddleware.verifyToken,
  verifyRole([3, 4, 5]),
  quizController.updateQuizQuestionById
);

// [DELETE] Delete a quiz question by ID
router.delete(
  '/:questionId',
  jwtMiddleware.verifyToken,
  verifyRole([3, 4, 5]),
  quizController.deleteQuizQuestionById
);

router.get( 
  '/results/question/:questionId',
  jwtMiddleware.verifyToken,
  verifyRole([3, 4, 5]), 
  quizController.getQuizResultsByQuestionId
);
//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;