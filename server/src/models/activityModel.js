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
                    route: true, // Include route field
                    createdAt: true,
                    updatedAt: true,
                    locationId: true,
                    order: true,
                },
                orderBy: {
                    order: 'asc', // Use order field for consistent sorting
                },
            });

            if (activities.length === 0) {
                throw new Error('No activities found.');
            }

            return activities;
        } catch (error) {
            throw new Error(`Failed to fetch activities: ${error.message}`);
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
                    route: true, // Include route field
                    createdAt: true,
                    updatedAt: true,
                    locationId: true,
                    order: true,
                },
            });

            if (!activity) {
                throw new Error(`Activity with ID ${id} not found.`);
            }

            return activity;
        } catch (error) {
            throw new Error(`Failed to fetch activity: ${error.message}`);
        }
    },

    createActivity: async (activityData) => {
        const { name, description, route } = activityData;

        if (!name || !description) {
            throw new Error('Invalid activity data. Ensure name and description are provided.');
        }

        // Validate route format if provided
        if (route && !route.match(/^\/[a-zA-Z0-9-_/:]*$/)) {
            throw new Error('Invalid route format. Route must start with "/" and contain only letters, numbers, hyphens, underscores, or colons.');
        }

        try {
            const newActivity = await prisma.activity.create({
                data: {
                    name,
                    description,
                    route: route || null,
                    order: 0, // Default order
                },
            });

            return newActivity;
        } catch (error) {
            throw new Error(`Failed to create activity: ${error.message}`);
        }
    },

    updateActivity: async (activityId, activityData) => {
        const id = parseInt(activityId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid activity ID. It must be a number.');
        }

        const { name, description, route, locationId } = activityData;

        if (!name || !description) {
            throw new Error('Invalid activity data. Ensure name and description are provided.');
        }

        // Validate route format if provided
        if (route && !route.match(/^\/[a-zA-Z0-9-_/:]*$/)) {
            throw new Error('Invalid route format. Route must start with "/" and contain only letters, numbers, hyphens, underscores, or colons.');
        }

        try {
            const updatedActivity = await prisma.activity.update({
                where: { activityId: id },
                data: {
                    name,
                    description,
                    route: route || null,
                },
            });

            return updatedActivity;
        } catch (error) {
            throw new Error(`Failed to update activity: ${error.message}`);
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
            throw new Error(`Failed to delete activity: ${error.message}`);
        }
    },

    reorderActivities: async (activities) => {
        // Validate input
        if (!Array.isArray(activities) || activities.length === 0) {
            throw new Error('Invalid input: activities must be a non-empty array.');
        }

        // Validate activity objects and parse activityId
        if (!activities.every(activity => activity && typeof activity === 'object' && 'activityId' in activity && !isNaN(parseInt(activity.activityId, 10)))) {
            throw new Error('Invalid input: all activities must have a valid numeric activityId.');
        }

        try {
            const updates = activities.map((activity, index) =>
                prisma.activity.update({
                    where: { activityId: parseInt(activity.activityId, 10) },
                    data: { order: index },
                })
            );

            await prisma.$transaction(updates);

            // Return the updated list of activities in order
            return prisma.activity.findMany({
                select: {
                    activityId: true,
                    name: true,
                    description: true,
                    route: true,
                    createdAt: true,
                    updatedAt: true,
                    locationId: true,
                    order: true,
                },
                orderBy: { order: 'asc' },
            });
        } catch (error) {
            throw new Error(`Failed to reorder activities: ${error.message}`);
        }
    },
};