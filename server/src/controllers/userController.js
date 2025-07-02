const userModel = require('../models/userModel.js');

module.exports = {
    login: async (req, res, next) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({
                message: `Missing required data.`,
            });
            return;
        }

        const data = {
            username: username,
            password: password,
        };

        try {
            const results = await userModel.selectByUsernameAndPassword(data);
            if (results) {
                if (Array.isArray(results) && results.length === 1) {
                    res.locals.user_id = results[0].userId;
                    res.locals.username = results[0].username;
                    res.locals.hash = results[0].passwordHash;
                    res.locals.role_id = results[0].roleId;
                    next();
                } else if (Array.isArray(results) && results.length > 1) {
                    res.status(409).json({
                        message: `Duplicate username for ${results[0].username}. Please try another username.`,
                    });
                } else {
                    res.status(404).json({
                        message: `Username ${data.username} does not exist. Please try another username.`,
                    });
                }
            }
        } catch (error) {
            console.error(`Error login: ${error}. \nPlease try again later.`);
            res.status(500).json(error);
        }
    },

    register: async (req, res, next) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({
                message: `Missing required data.`,
            });
            return;
        }

        const data = {
            username: username,
            password: password,
        };

        try {
            const results = await userModel.createNewUser(data);
            if (results) {
                res.locals.message = `User ${data.username} successfully created.`;
                res.locals.user_id = results.userId;
                res.locals.username = results.username;
                res.locals.hash = results.passwordHash;
                res.locals.role_id = results.roleId || null;
                next();
            } else {
                res.status(500).json({
                    message: `User registration failed.`,
                });
            }
        } catch (error) {
            console.error(`Error register: ${error}. \nPlease try again later.`);
            res.status(500).json(error);
        }
    },

    checkUsernameExist: async (req, res, next) => {
        const { username } = req.body;

        const data = {
            username: username,
        };

        if (!username) {
            res.status(400).json({
                message: `Missing username.`,
            });
            return;
        }

        try {
            const results = await userModel.selectByUsernameAndPassword(data);
            if (results && Array.isArray(results) && results.length > 0) {
                res.status(409).json({
                    message: `Username already exists. Please try another username.`,
                });
            } else {
                next();
            }
        } catch (error) {
            console.error(`Error checkUsernameExist: ${error}. \nPlease try again later.`);
            res.status(500).json(error);
        }
    },

    readLoggedInPlayer: async (req, res, next) => {
        const user_id = res.locals.user_id;

        const data = {
            user_id: user_id,
        };

        try {
            const results = await userModel.readLoggedInUser(data);
            if (!results) {
                return res.status(404).json({ message: `User ${user_id} does not exist` });
            }
            return res.status(200).json(results);
        } catch (error) {
            console.error(`Error readLoggedInPlayer: ${error}`);
            return res.status(500).json(error);
        }
    },
};