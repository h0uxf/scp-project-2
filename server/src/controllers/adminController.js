const adminModel = require('../models/adminModel.js');

module.exports = {
    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const users = await adminModel.readAllUsers();
            res.status(200).json(users);
        } catch (error) {
            console.error(`Error fetching all users: ${error}`);
            if (error.message.includes('No users found')) {
                return res.status(404).json({ error: 'No users found.' });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    // Get user by ID
    getUserById: async (req, res) => {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        try {
            const user = await adminModel.readUserById(userId);
            res.status(200).json(user);
        } catch (error) {
            console.error(`Error fetching user by ID: ${error}`);
            if (error.message.includes('User with ID') && error.message.includes('not found')) {
                return res.status(404).json({ error: `User with ID ${userId} not found.` });
            }
            if (error.message.includes('Invalid user ID')) {
                return res.status(400).json({ error: 'Invalid user ID. It must be a number.' });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    // Update user by ID
    updateUserById: async (req, res) => {
        const { userId } = req.params;
        const { username, points, roleId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!username && points === undefined && roleId === undefined) {
            return res.status(400).json({ message: 'At least one field (username, points, or roleId) is required for update' });
        }

        try {
            const updatedUser = await adminModel.updateUserById(userId, { username, points, roleId });
            res.status(200).json({
                message: 'User updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            console.error(`Error updating user: ${error}`);
            if (error.message.includes('User with ID') && error.message.includes('not found')) {
                return res.status(404).json({ error: `User with ID ${userId} not found.` });
            }
            if (error.message.includes('Invalid user ID')) {
                return res.status(400).json({ error: 'Invalid user ID. It must be a number.' });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    // Delete user by ID
    deleteUserById: async (req, res) => {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        try {
            await adminModel.deleteUserById(userId);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error(`Error deleting user: ${error}`);
            if (error.message.includes('User with ID') && error.message.includes('not found')) {
                return res.status(404).json({ error: `User with ID ${userId} not found.` });
            }
            if (error.message.includes('Invalid user ID')) {
                return res.status(400).json({ error: 'Invalid user ID. It must be a number.' });
            }
            return res.status(500).json({ error: error.message });
        }
    },

    // Get user statistics
    getUserStatistics: async (req, res) => {
        try {
            const statistics = await adminModel.getUserStatistics();
            res.status(200).json(statistics);
        } catch (error) {
            console.error(`Error fetching user statistics: ${error}`);
            return res.status(500).json({ error: error.message });
        }
    },
};