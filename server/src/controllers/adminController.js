// controllers/adminController.js
const logger = require("../logger.js");
const adminModel = require("../models/adminModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  // Get all users
  getAllUsers: catchAsync(async (req, res, next) => {
    const users = await adminModel.readAllUsers();
    if (!users || users.length === 0) {
      logger.warn("Fetch all users failed: No users found");
      return next(new AppError("No users found", 404));
    }
    logger.debug("Fetching all users");
    res.status(200).json({ status: "success", data: users });
  }),

  // Get user by ID
  getUserById: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    if (!userId) {
      logger.warn("Fetch user by ID failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    const user = await adminModel.readUserById(userId);
    if (!user) {
      logger.warn(`Fetch user by ID failed: User with ID ${userId} not found`);
      return next(new AppError(`User with ID ${userId} not found`, 404));
    }
    logger.debug(`Fetched user with ID ${userId}`);
    res.status(200).json({ status: "success", data: user });
  }),

  // Update user by ID
  updateUserById: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { username, points, roleId } = req.body;

    if (!userId) {
      logger.warn("Update user by ID failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    if (!username && points === undefined && roleId === undefined) {
      logger.warn("Update user by ID failed: No fields provided for update");
      return next(
        new AppError(
          "At least one field (username, points, or roleId) is required for update",
          400
        )
      );
    }

    const updatedUser = await adminModel.updateUserById(userId, {
      username,
      points,
      roleId,
    });
    if (!updatedUser) {
      logger.warn(`Update user by ID failed: User with ID ${userId} not found`);
      return next(new AppError(`User with ID ${userId} not found`, 404));
    }
    logger.info(`User with ID ${userId} updated`);
    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  }),

  // Delete user by ID
  deleteUserById: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    if (!userId) {
      logger.warn("Delete user by ID failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    const deletedUser = await adminModel.deleteUserById(userId);
    if (!deletedUser) {
      logger.warn(`Delete user by ID failed: User with ID ${userId} not found`);
      return next(new AppError(`User with ID ${userId} not found`, 404));
    }
    logger.info(`User with ID ${userId} deleted`);
    res.status(200).json({ status: "success", message: "User deleted successfully" });
  }),

  // Get user statistics
  getUserStatistics: catchAsync(async (req, res, next) => {
    const statistics = await adminModel.getUserStatistics();
    if (!statistics) {
      logger.warn("Fetch user statistics failed: No statistics available");
      return next(new AppError("No user statistics available", 404));
    }
    logger.debug("Fetching user statistics");
    res.status(200).json({ status: "success", data: statistics });
  }),
};