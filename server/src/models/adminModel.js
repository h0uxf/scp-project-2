const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    // Get all users
    readAllUsers: async () => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    userId: true,
                    username: true,
                    points: true,
                    createdAt: true,
                    updatedAt: true,
                    roleId: true,
                    role: {
                        select: {
                            roleId: true,
                            roleName: true,
                            description: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            if (users.length === 0) {
                throw new Error('No users found.');
            }

            // Transform the data to match expected format
            return users.map(user => ({
                ...user,
                role_id: user.roleId,
                role_name: user.role?.roleName,
            }));
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
                    createdAt: true,
                    updatedAt: true,
                    roleId: true,
                    role: {
                        select: {
                            roleId: true,
                            roleName: true,
                            description: true,
                        },
                    },
                    userActivities: {
                        select: {
                            activity: {
                                select: {
                                    name: true,
                                    description: true,
                                },
                            },
                            points: true,
                            createdAt: true,
                        },
                    },
                    userLocation: {
                        select: {
                            location: {
                                select: {
                                    name: true,
                                    description: true,
                                    code: true,
                                },
                            },
                            createdAt: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new Error(`User with ID ${id} not found.`);
            }

            // Transform the data to match expected format
            return {
                ...user,
                role_id: user.roleId,
                role_name: user.role?.roleName,
            };
        } catch (error) {
            throw error;
        }
    },

    // Update user role by ID
    updateUserById: async (userId, userData) => {
        const id = parseInt(userId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid user ID. It must be a number.');
        }

        try {
            const { roleId } = userData;
            const roleIdInt = parseInt(roleId, 10);

            // Update user role directly in the user table
            const updatedUser = await prisma.user.update({
                where: { userId: id },
                data: {
                    roleId: roleIdInt,
                    updatedAt: new Date(),
                },
                select: {
                    userId: true,
                    username: true,
                    roleId: true,
                    role: {
                        select: {
                            roleId: true,
                            roleName: true
                        }
                    },
                    updatedAt: true,
                },
            });

            return updatedUser;
        } catch (error) {
            throw error;
        }
    },

    // Delete user by ID
    deleteUserById: async (userId) => {
        const id = parseInt(userId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid user ID. It must be a number.');
        }

        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { userId: id },
            });

            if (!existingUser) {
                throw new Error(`User with ID ${id} not found.`);
            }

            // Delete user (cascading will handle related records)
            const deletedUser = await prisma.user.delete({
                where: { userId: id },
            });

            return deletedUser;
        } catch (error) {
            throw error;
        }
    },

    // Get user statistics
    getUserStatistics: async () => {
        try {
            const totalUsers = await prisma.user.count();
            const activeUsers = await prisma.user.count({
                where: {
                    userActivities: {
                        some: {},
                    },
                },
            });

            const usersByRole = await prisma.role.findMany({
                select: {
                    roleName: true,
                    _count: {
                        select: {
                            userRole: true,
                        },
                    },
                },
            });

            const topUsers = await prisma.user.findMany({
                select: {
                    userId: true,
                    username: true,
                    points: true,
                },
                orderBy: {
                    points: 'desc',
                },
                take: 10,
            });

            return {
                totalUsers,
                activeUsers,
                usersByRole,
                topUsers,
            };
        } catch (error) {
            throw error;
        }
    },
};