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
router.get('/', quizController.getAllQuizQuestions);

// [POST] Submit quiz answer by question ID
router.post(
  '/:questionId/submit',
  jwtMiddleware.verifyAccessToken,
  quizController.submitQuizAnswerById
);

// [GET] Calculate personality trait for logged-in user
router.get(
  '/personality',
  jwtMiddleware.verifyAccessToken,
  quizController.getPersonalityResultByUserId
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (PLAYER & ADMIN)
//////////////////////////////////////////////////////
router.get(
  '/results/user/:userId',
  jwtMiddleware.verifyAccessToken,
  verifyRole([4, 5]),
  quizController.getQuizResultsByUserId
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (CONTENT MANAGER, ADMIN AND SUPER ADMIN)
//////////////////////////////////////////////////////
router.post(
  '/',
  jwtMiddleware.verifyAccessToken,
  verifyRole([3, 4, 5]),
  quizController.createQuizQuestion
);

router.put(
  '/:questionId',
  jwtMiddleware.verifyAccessToken,
  verifyRole([3, 4, 5]),
  quizController.updateQuizQuestionById
);

router.delete(
  '/:questionId',
  jwtMiddleware.verifyAccessToken,
  verifyRole([3, 4, 5]),
  quizController.deleteQuizQuestionById
);

router.get(
  '/results/question/:questionId',
  jwtMiddleware.verifyAccessToken,
  verifyRole([3, 4, 5]),
  quizController.getQuizResultsByQuestionId
);

router.get('/:questionId', quizController.getQuizQuestionById);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;
