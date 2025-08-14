//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');
const prisma = require('@prisma/client'); 

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const quizController = require('../controllers/quizController.js');
const roleMiddleware = require('../middlewares/roleMiddleware.js');

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
    quizController.submitQuizAndCalculatePersonality
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR QUIZ (CONTENT MANAGER, ADMIN, AND SUPER ADMIN)
//////////////////////////////////////////////////////
router.put(
    '/reorder',
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    quizController.reorderQuizQuestions
)

router.post(
    '/',
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    questionValidationRules(), 
    validate,                  
    quizController.createQuizQuestion
);

router.put(
    '/:questionId',
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    questionValidationRules(), 
    validate,                  
    quizController.updateQuizQuestion
);

router.delete(
    '/:questionId',
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    quizController.deleteQuizQuestion
);

router.put(
    '/:questionId/options/reorder',
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    quizController.reorderQuizOptionsById
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;
