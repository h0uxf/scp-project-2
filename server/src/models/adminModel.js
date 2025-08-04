const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    // Get all users with pagination
    readAllUsers: async (page = 1, limit = 10, search = '', sortBy = 'userId', sortOrder = 'asc', role = '') => {
        try {
            const skip = (page - 1) * limit;
            
            // Build search and filter conditions
            const whereCondition = {};
            
            // Add search condition - only search by username
            if (search) {
                whereCondition.username = { contains: search, mode: 'insensitive' };
            }
            
            // Add role filter condition
            if (role) {
                whereCondition.role = {
                    roleName: role
                };
            }

            // Get total count for pagination
            const totalUsers = await prisma.user.count({
                where: whereCondition
            });

            // Build sort condition
            let orderBy = {};
            switch (sortBy) {
                case 'userId':
                    orderBy.userId = sortOrder;
                    break;
                case 'points':
                    orderBy.points = sortOrder;
                    break;
                case 'createdAt':
                    orderBy.createdAt = sortOrder;
                    break;
                default:
                    orderBy.userId = 'asc';
            }

            // Get users with pagination
            const users = await prisma.user.findMany({
                where: whereCondition,
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
                orderBy: orderBy,
                skip: skip,
                take: limit,
            });

            const totalPages = Math.ceil(totalUsers / limit);

            // Transform the data to match expected format
            const transformedUsers = users.map(user => ({
                ...user,
                role_id: user.roleId,
                role_name: user.role?.roleName,
            }));

            return {
                users: transformedUsers,
                totalUsers,
                totalPages,
                currentPage: page
            };
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

    // Update user role by role name
    updateUserByRoleName: async (userId, roleName) => {
        const id = parseInt(userId, 10);
        if (isNaN(id)) {
            throw new Error('Invalid user ID. It must be a number.');
        }

        try {
            // First, find the role by name to get the roleId
            const role = await prisma.role.findUnique({
                where: { roleName: roleName }
            });

            if (!role) {
                throw new Error(`Role '${roleName}' not found.`);
            }

            // Update user role directly in the user table
            const updatedUser = await prisma.user.update({
                where: { userId: id },
                data: {
                    roleId: role.roleId,
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

            // Transform the data to match expected format
            return {
                ...updatedUser,
                role_id: updatedUser.roleId,
                role_name: updatedUser.role?.roleName,
            };
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