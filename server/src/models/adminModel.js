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
                    userRole: {
                        select: {
                            role: {
                                select: {
                                    roleId: true,
                                    roleName: true,
                                    description: true,
                                },
                            },
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
                    createdAt: true,
                    updatedAt: true,
                    userRole: {
                        select: {
                            role: {
                                select: {
                                    roleId: true,
                                    roleName: true,
                                    description: true,
                                },
                            },
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

            return user;
        } catch (error) {
            throw error;
        }
    },

    // Update user by ID
    updateUserById: async (userId, userData) => {
        const id = parseInt(userId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid user ID. It must be a number.');
        }

        try {
            const { username, points, roleId } = userData;

            // Update user basic info
            const updatedUser = await prisma.user.update({
                where: { userId: id },
                data: {
                    username,
                    points: points !== undefined ? parseInt(points, 10) : undefined,
                    updatedAt: new Date(),
                },
                select: {
                    userId: true,
                    username: true,
                    points: true,
                    updatedAt: true,
                },
            });

            // Update user role if provided
            if (roleId !== undefined) {
                const roleIdInt = parseInt(roleId, 10);
                
                // Delete existing user role
                await prisma.userRole.deleteMany({
                    where: { userId: id },
                });

                // Create new user role
                await prisma.userRole.create({
                    data: {
                        userId: id,
                        roleId: roleIdInt,
                    },
                });
            }

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