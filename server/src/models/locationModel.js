const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {

    getLocationById: async (locationId) => {

        try {
            const location = await prisma.location.findUnique({
                where: { locationId: locationId },
                select: {
                    locationId: true,
                    name: true,
                    description: true,
                    code: true,
                    points: true,
                    createdAt: true,
                    updatedAt: true,
                    activity : {
                        select: {
                            activityId: true,
                            name: true,
                            description: true,
                            route: true,
                        },

                    }
                },
            });

            if (!location) {
                throw new Error(`Location with ID ${locationId} not found.`);
            }

            return location;
        } catch (error) {
            throw error;
        }
    },

    getAllLocations: async () => {
        try {
            const locations = await prisma.location.findMany({
                select: {
                    locationId: true,
                    name: true,
                    description: true,
                    code: true,
                    points: true,
                    createdAt: true,
                    updatedAt: true,
                    activity: {
                        select: {
                            activityId: true,
                            name: true,
                            description: true,
                            route: true,
                        },
                    },
                },
            });

            return locations;
        } catch (error) {
            throw error;
        }
    
    }
};