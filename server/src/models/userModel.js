// Goh Yi Xin Karys P2424431 DIT/FT/2A/01
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    selectByUsernameAndPassword: async (data) => {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    username: data.username,
                },
                select: {
                    userId: true,
                    username: true,
                    passwordHash: true, 
                    roleId: true,
                },
            });
            return user;
        } catch (error) {
            throw error;
        }
    },

    createNewUser: async (data) => {
        try {
            const newUser = await prisma.user.create({
                data: {
                    username: data.username,
                    passwordHash: data.password, 
                },
                select: {
                    userId: true,
                    username: true,
                },
            });
            return newUser;
        } catch (error) {
            throw error;
        }
    },

    readLoggedInUser: async (data) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    userId: data.user_id,
                },
                select: {
                    userId: true,
                    username: true,
                    roleId: true,
                },
            });
            return user;
        } catch (error) {
            throw error;
        }
    },
};