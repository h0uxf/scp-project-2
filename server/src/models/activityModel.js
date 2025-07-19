const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    getAllActivities: async () => {
        try {
            const activities = await prisma.activity.findMany({
                select: {
                    activityId: true,
                    name: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            if (activities.length === 0) {
                throw new Error('No activities found.');
            }

            return activities;
        } catch (error) {
            throw error;
        }
    },

    getActivityById: async (activityId) => {
        const id = parseInt(activityId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid activity ID. It must be a number.');
        }

        try {
            const activity = await prisma.activity.findUnique({
                where: { activityId: id },
                select: {
                    activityId: true,
                    name: true,
                    description: true, 
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!activity) {
                throw new Error(`Activity with ID ${id} not found.`);
            }

            return activity;
        } catch (error) {
            throw error;
        }
    },

    createActivity: async (activityData) => {
        const { name, description } = activityData;

        if (!name || !description) {
            throw new Error('Invalid activity data. Ensure name and description are provided.');
        }

        try {
            const newActivity = await prisma.activity.create({
                data: {
                    name,
                    description,
                    order: 0, // Default order
                },
            });

            return newActivity;
        } catch (error) {
            throw error;
        }
    },

    updateActivity: async (activityId, activityData) => {
        const id = parseInt(activityId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid activity ID. It must be a number.');
        }

        try {
            const updatedActivity = await prisma.activity.update({
                where: { activityId: id },
                data: activityData,
            });

            return updatedActivity;
        } catch (error) {
            throw error;
        }
    },

    deleteActivity: async (activityId) => {
        const id = parseInt(activityId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid activity ID. It must be a number.');
        }

        try {
            const deletedActivity = await prisma.activity.delete({
                where: { activityId: id },
            });

            return deletedActivity;
        } catch (error) {
            throw error;
        }
    },

    reorderActivities: async (activities) => {
        // Validate input
        if (!Array.isArray(activities) || activities.length === 0) {
            throw new Error('Invalid input: activities must be a non-empty array.');
        }

        // Validate activity objects
        if (!activities.every(activity => activity && typeof activity === 'object' && 'activityId' in activity)) {
            throw new Error('Invalid input: all activities must have an activityId property.');
        }

        try {
            const updatedActivities = await prisma.$transaction(
                activities.map((activity, index) =>
                    prisma.activity.update({
                        where: { activityId: activity.activityId },
                        data: { order: index },
                    })
                )
            );

            return updatedActivities;
        } catch (error) {
            // Log error for debugging (in a production environment, use a proper logging service)
            console.error('Failed to reorder activities:', error);

            // Throw a more specific error
            throw new Error(`Failed to reorder activities: ${error.message}`);
        }
    },
}