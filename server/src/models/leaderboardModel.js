const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    // Get top 100 users
    read100Users: async () => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    userId: true,
                    username: true,
                    points: true,
                },
                orderBy: {
                    points: 'desc',
                },
                take: 100,
            });

            if (users.length === 0) {
                throw new Error('No users found.');
            }

            return users;
        } catch (error) {
            throw error;
        }
    },

    // Get user by ID
    readUserById: async (userId) => {
        const id = parseInt(userId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid user ID. It must be a number.');
        }

        try {
            const user = await prisma.user.findUnique({
                where: { userId: id },
                select: {
                    userId: true,
                    username: true,
                    points: true,
                },
            });

            if (!user) {
                throw new Error(`User with ID ${id} not found.`);
            }

            return user;
        } catch (error) {
            throw error;
        }
    },
};