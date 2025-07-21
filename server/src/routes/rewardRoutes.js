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

// [GET] Check reward status (no auth required for frontend polling)
router.get(
    '/status',
    rewardValidationRules(),
    validate,
    rewardController.getRewardStatus
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;