const logger = require("../logger.js");
const rewardModel = require("../models/rewardModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const activityModel = require("../models/activityModel.js");

module.exports = {
  // Get all rewards
  getAllRewards: catchAsync(async (req, res, next) => {
    const rewards = await rewardModel.getAllRewards();
    if (!rewards || rewards.length === 0) {
      logger.warn("No rewards found");
      return next(new AppError("No rewards found", 404));
    }
    logger.debug("Fetching all rewards");
    res.status(200).json({ status: "success", data: rewards });
  }),

  // Get reward by ID
  getRewardById: catchAsync(async (req, res, next) => {
    const { rewardId } = req.params;
    if (!rewardId) {
      logger.warn("Fetch reward by ID failed: Missing reward ID");
      return next(new AppError("Reward ID is required", 400));
    }
    const reward = await rewardModel.getRewardById(rewardId);
    if (!reward) {
      logger.warn(`Reward with ID ${rewardId} not found`);
      return next(new AppError(`Reward with ID ${rewardId} not found`, 404));
    }
    logger.debug(`Fetching reward with ID ${rewardId}`);
    res.status(200).json({ status: "success", data: reward });
  }),

  checkCompletion: catchAsync(async (req, res, next) => {
    const userId = res.locals.user_id;

    if (!userId) {
        logger.warn("Check completion failed: Missing user ID");
        return next(new AppError("User ID is required", 400));
    }

    try {
      const completionStatus = await activityModel.checkCompletion(userId);
      logger.debug(`Completion check successful for user ID ${userId}`);
      next();
    } catch (error) {
      logger.error(`Error checking completion for user ID ${userId}: ${error.message}`);
      if (error.message.includes("No activities found")) {
          return next(new AppError("No activities found in the system", 404));
      }
      if (error.message.includes("Invalid user ID")) {
          return next(new AppError("Invalid user ID", 400));
      }
      return next(new AppError(`Failed to check completion: ${error.message}`, 500));
    }
  }),

  // Generate a reward and QR code
  generateReward: catchAsync(async (req, res, next) => {
    const userId = res.locals.user_id; 

    if (!userId) {
      logger.warn("Generate reward failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    try {
      const reward = await rewardModel.createReward({ userId });
      logger.info(`Reward generated for user ID ${userId}`);
      res.status(201).json({
        status: "success",
        message: "Reward generated successfully",
        data: reward,
      });
    } catch (error) {
      logger.error(`Error generating reward for user ID ${userId}: ${error.message}`);
      
      if (error.message.includes("User has already redeemed a reward")) {
        return next(new AppError("You have already redeemed a reward and cannot generate another one.", 403));
      }
      if (error.message.includes("User already has a reward assigned. Cannot generate new QR token")) {
        return next(new AppError(`${error.message}`, 409));
      }
      if (error.message.includes("No activities found")) {
        return next(new AppError("No activities found in the system", 404));
      }
      return next(new AppError(`${error.message}`, 500));
    }
  }),

  // Redeem a reward via QR code
  redeemReward: catchAsync(async (req, res, next) => {
    const { qrToken } = req.body;

    if (!qrToken) {
      logger.warn("Redeem reward failed: Missing QR token");
      return next(new AppError("QR token is required", 400));
    }

    try {
      const reward = await rewardModel.redeemReward(qrToken);
      logger.info(`Reward with QR token ${qrToken} redeemed successfully`);
      res.status(200).json({
        status: "success",
        message: "Reward redeemed successfully",
        data: reward,
      });
    } catch (error) {
      logger.error(`Error redeeming reward with QR token ${qrToken}: ${error.message}`);
      if (error.message.includes("Reward not found")) {
        return next(new AppError("Invalid QR token", 404));
      }
      if (error.message.includes("already redeemed") || error.message.includes("expired")) {
        return next(new AppError(error.message, 409));
      }
      return next(new AppError(`Failed to redeem reward: ${error.message}`, 500));
    }
  }),

  // Check reward status
  getRewardStatus: catchAsync(async (req, res, next) => {
    const { qrToken } = req.query;
    const userId = res.locals.user_id;

    if (!qrToken && !userId) {
      logger.warn("Error fetching reward status: Invalid QR token or user ID. One must be provided.");
      return next(new AppError("Invalid QR token or user ID. One must be provided.", 400));
    }

    try {
      let status;
      if (qrToken) {
        status = await rewardModel.getRewardStatusByToken(qrToken);
        if (!status) {
          logger.warn(`No reward found for QR token ${qrToken}.`);
          return next(new AppError("Invalid QR token.", 404));
        }
        logger.debug(`Fetching status for reward with QR token ${qrToken}`);
      } else {
        status = await rewardModel.getRewardStatusByUserId(userId);

        if (!status) {
          logger.warn(`Error fetching reward status for user ${userId}.`);
          return next(new AppError("Failed to fetch reward status.", 500));
        }
        logger.debug(`Fetching status for reward for user ${userId}`);
      }

      res.status(200).json({
        status: "success",
        data: status,
      });

    } catch (error) {
      logger.error(`Error fetching reward status: ${error.message}`);
      return next(new AppError(`Failed to fetch reward status: ${error.message}`, 500));
    }
  }),

  getRewardStatistics: catchAsync(async (req, res, next) => {
    try {
      const statistics = await rewardModel.getRewardStatisticsAggregate();
      logger.debug("Fetching reward statistics");
      res.status(200).json({
        status: "success",
        message: "Reward statistics retrieved successfully",
        data: statistics,
      });
    } catch (error) {
      logger.error(`Error fetching reward statistics: ${error.message}`);
      return next(new AppError(`Failed to fetch reward statistics: ${error.message}`, 500));
    }
  }),
};