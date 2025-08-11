// This module contains all the core business logic for managing rewards.
// It interacts with the database via Prisma and handles QR code generation.

const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { getRewardStatus } = require('../controllers/rewardController');

const prisma = new PrismaClient();

module.exports = {
  // Fetches all rewards from the database, ordered by creation date (descending).
  getAllRewards: async () => {
    try {
      const rewards = await prisma.reward.findMany({
        select: {
          rewardId: true,
          userId: true,
          activityId: true,
          qrToken: true,
          isRedeemed: true,
          createdAt: true,
          redeemedAt: true,
          expiresAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Returns an empty array if no rewards are found.
      if (rewards.length === 0) {
        return [];
      }

      return rewards;
    } catch (error) {
      throw new Error(`Failed to fetch rewards: ${error.message}`);
    }
  },

  // Fetches a single reward by its unique ID.
  getRewardById: async (rewardId) => {
    const id = parseInt(rewardId, 10);
    if (isNaN(id)) {
      throw new Error('Invalid reward ID. It must be a number.');
    }

    try {
      const reward = await prisma.reward.findUnique({
        where: { rewardId: id },
        select: {
          rewardId: true,
          userId: true,
          activityId: true,
          qrToken: true,
          isRedeemed: true,
          createdAt: true,
          redeemedAt: true,
          expiresAt: true,
        },
      });

      if (!reward) {
        throw new Error(`Reward with ID ${id} not found.`);
      }

      return reward;
    } catch (error) {
      throw new Error(`Failed to fetch reward: ${error.message}`);
    }
  },

  // Creates a new reward for a user, or returns an existing unredeemed one.
  createReward: async ({ userId }) => {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new Error('Invalid userId. It must be a number.');
    }

    try {
      // Find the latest activity to link the new reward to it.
      const activities = await prisma.activity.findMany({
        select: { activityId: true },
        orderBy: { activityId: 'desc' },
        take: 1,
      });

      if (activities.length === 0) {
        throw new Error('No activities found in the system.');
      }

      const activityId = Number(activities[0].activityId);
      if (isNaN(activityId)) {
        throw new Error('Invalid activityId obtained from database.');
      }

      // Check if a valid (non-redeemed) reward for the latest activity already exists for this user.
      const existingReward = await prisma.reward.findFirst({
        where: {
          userId: numericUserId,
          activityId: activityId,
          isRedeemed: false,
          expiresAt: { gte: new Date() },
        },
      });

      if (existingReward) {
        // If a valid reward exists, return it with a new QR code URL without generating a new database entry.
        const qrCodeUrl = await QRCode.toDataURL(
          `http://localhost:5173/redeem?qrToken=${existingReward.qrToken}`
        );
        return { ...existingReward, qrCodeUrl };
      }

      // If no valid reward exists, generate a brand new one.
      const qrToken = uuidv4();
      const newReward = await prisma.reward.create({
        data: {
          userId: numericUserId,
          activityId: activityId,
          qrToken,
          isRedeemed: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Generate the QR code URL for the new token.
      const qrCodeUrl = await QRCode.toDataURL(`http://localhost:5173/redeem?qrToken=${qrToken}`);

      return { ...newReward, qrCodeUrl };
    } catch (error) {
      throw new Error(`Failed to create reward: ${error.message}`);
    }
  },

  // Gets the status of a specific reward by qrToken, or the user's latest reward if no token is provided.
  getRewardStatusByUserId: async (userId) => {
    if (!userId) {
      throw new Error('User ID must be provided.');
    }

    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new Error('Invalid user ID. It must be a number.');
    }

    const now = new Date();

    try {
      const reward = await prisma.reward.findFirst({
        where: {
          userId: numericUserId,
          isRedeemed: false,
          expiresAt: { gte: now },
        },
        select: {
          rewardId: true,
          isRedeemed: true,
          redeemedAt: true,
          expiresAt: true,
          qrToken: true,
        },
      });

      return {
        hasRewardAssigned: !!reward,
        isRedeemed: reward ? reward.isRedeemed : false,
        redeemedAt: reward ? reward.redeemedAt : null,
        isExpired: reward ? reward.expiresAt < now : false,
        qrToken: reward ? reward.qrToken : null,
      };
    } catch (error) {
      throw new Error(`Failed to fetch reward status by user ID: ${error.message}`);
    }
  }, 

  getRewardStatusByToken: async (qrToken) => {
    if (!qrToken || typeof qrToken !== 'string') {
      throw new Error('QR token must be a non-empty string.');
    }

    const now = new Date();

    try {
      const reward = await prisma.reward.findUnique({
        where: { qrToken },
        select: {
          rewardId: true,
          isRedeemed: true,
          redeemedAt: true,
          expiresAt: true,
          qrToken: true,
        },
      });

      if (!reward) {
        return {
          hasRewardAssigned: false,
          isRedeemed: false,
          redeemedAt: null,
          isExpired: false,
          qrToken: null,
        };
      }

      return {
        hasRewardAssigned: true,
        isRedeemed: reward.isRedeemed,
        redeemedAt: reward.redeemedAt,
        isExpired: reward.expiresAt ? reward.expiresAt < now : false,
        qrToken: reward.qrToken,
      };
    } catch (error) {
      throw new Error(`Failed to fetch reward status by token: ${error.message}`);
    }
  }, 

  // Marks a reward as redeemed.
  redeemReward: async (qrToken) => {
    if (!qrToken || typeof qrToken !== 'string') {
      throw new Error('Invalid QR token. It must be a non-empty string.');
    }

    try {
      const reward = await prisma.reward.findUnique({
        where: { qrToken },
      });

      if (!reward) {
        throw new Error('Reward not found.');
      }

      if (reward.isRedeemed) {
        throw new Error('Reward already redeemed.');
      }

      if (reward.expiresAt && reward.expiresAt < new Date()) {
        throw new Error('Reward has expired.');
      }

      const updatedReward = await prisma.reward.update({
        where: { qrToken },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
        select: {
          rewardId: true,
          userId: true,
          activityId: true,
          qrToken: true,
          isRedeemed: true,
          createdAt: true,
          redeemedAt: true,
          expiresAt: true,
        },
      });

      return updatedReward;
    } catch (error) {
      throw new Error(`Failed to redeem reward: ${error.message}`);
    }
  },

  // Provides aggregate statistics on total and redeemed rewards.
  getRewardStatisticsAggregate: async () => {
    try {
      const [totalCount, redeemedCount] = await Promise.all([
        prisma.reward.count(),
        prisma.reward.count({
          where: {
            isRedeemed: true,
          },
        }),
      ]);

      return {
        total: totalCount,
        redeemed: redeemedCount,
        notRedeemed: totalCount - redeemedCount,
      };
    } catch (error) {
      throw new Error(`Failed to fetch reward statistics: ${error.message}`);
    }
  },
};
