// Goh Yi Xin Karys P2424431 DIT/FT/2A/01
//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');
const prisma = require('@prisma/client'); 

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const rewardController = require('../controllers/rewardController.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const roleMiddleware = require('../middlewares/roleMiddleware.js');

//////////////////////////////////////////////////////
// IMPORT MIDDLEWARES FOR INPUT VALIDATION
//////////////////////////////////////////////////////
const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');
const {
    validate,
    rewardValidationRules
} = require('../middlewares/validators'); 

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR REWARDS (PLAYER)
//////////////////////////////////////////////////////
router.get('/', rewardController.getAllRewards);

// [GET] Check reward status for a specific QR token (e.g., for real-time polling)
router.get(
    '/status',
    jwtMiddleware.verifyAccessToken,
    rewardValidationRules(),
    validate,
    rewardController.getRewardStatus
);

// [GET] View reward statistics
router.get(
    '/stats',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    rewardController.getRewardStatistics
)

router.get('/:rewardId', rewardController.getRewardById);

// [POST] Generate reward and QR code for logged-in user
router.post(
    '/generate',
    jwtMiddleware.verifyAccessToken,
    rewardController.checkCompletion,
    rewardValidationRules(),
    validate,
    rewardController.generateReward
);

// [POST] Redeem reward via QR code (no auth required for scanner)
router.post(
    '/redeem',
    rewardValidationRules(),
    validate,
    rewardController.redeemReward
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;
