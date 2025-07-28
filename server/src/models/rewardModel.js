const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

module.exports = {
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

      if (rewards.length === 0) {
        throw new Error('No rewards found.');
      }

      return rewards;
    } catch (error) {
      throw new Error(`Failed to fetch rewards: ${error.message}`);
    }
  },

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

  createReward: async ({ userId }) => {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new Error('Invalid userId. It must be a number.');
    }

    try {
      // Check if user already has a reward assigned
      const userRewardCount = await prisma.reward.count({
        where: {
          userId: numericUserId,
        },
      });

      if (userRewardCount > 0) {
        throw new Error('User already has a reward assigned. Cannot generate new QR token.');
      }

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

      // Check if a valid (non-redeemed) reward already exists
      const existingReward = await prisma.reward.findFirst({
        where: {
          userId: numericUserId,
          activityId: activityId,
          isRedeemed: false,
          expiresAt: { gte: new Date() },
        },
      });

      if (existingReward) {
        const qrCodeUrl = await QRCode.toDataURL(
          `http://localhost:5173/redeem?qrToken=${existingReward.qrToken}`
        );
        return { ...existingReward, qrCodeUrl };
      }

      // Generate new reward
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

      const qrCodeUrl = await QRCode.toDataURL(`http://localhost:5173/redeem?qrToken=${qrToken}`);

      return { ...newReward, qrCodeUrl };
    } catch (error) {
      throw new Error(`Failed to create reward: ${error.message}`);
    }
  },

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

  getRewardStatus: async (qrToken, userId) => {
    if (!qrToken || typeof qrToken !== 'string') {
      // If no qrToken provided, check if user has any reward
      if (!userId) {
        throw new Error('Invalid QR token or user ID. One must be provided.');
      }

      try {
        const numericUserId = Number(userId);
        if (isNaN(numericUserId)) {
          throw new Error('Invalid user ID. It must be a number.');
        }

        const reward = await prisma.reward.findFirst({
          where: {
            userId: numericUserId,
            isRedeemed: false,
            expiresAt: { gte: new Date() },
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
          isExpired: reward ? reward.expiresAt < new Date() : false,
          qrToken: reward ? reward.qrToken : null,
        };
      } catch (error) {
        throw new Error(`Failed to fetch reward status: ${error.message}`);
      }
    }

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
        isExpired: reward.expiresAt ? reward.expiresAt < new Date() : false,
        qrToken: reward.qrToken,
      };
    } catch (error) {
      throw new Error(`Failed to fetch reward status: ${error.message}`);
    }
  },

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