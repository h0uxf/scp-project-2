// controllers/adminController.js
const logger = require("../logger.js");
const adminModel = require("../models/adminModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  // Get all users with pagination
  getAllUsers: catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'userId';
    const sortOrder = req.query.sortOrder || 'asc';
    const role = req.query.role || '';
    
    const result = await adminModel.readAllUsers(page, limit, search, sortBy, sortOrder, role);
    if (!result) {
      logger.warn("Fetch all users failed: Database error");
      return next(new AppError("Failed to fetch users", 500));
    }
    
    logger.debug(`Fetching users - page: ${page}, limit: ${limit}, search: ${search}, sortBy: ${sortBy}, sortOrder: ${sortOrder}, role: ${role}`);
    res.status(200).json({ 
      status: "success", 
      data: result.users,
      pagination: {
        currentPage: page,
        totalPages: result.totalPages,
        totalUsers: result.totalUsers,
        hasNextPage: page < result.totalPages,
        hasPrevPage: page > 1
      }
    });
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

  // Update user role by ID
  updateUserById: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { role_name } = req.body;

    if (!userId) {
      logger.warn("Update user role failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    if (!role_name) {
      logger.warn("Update user role failed: No role name provided");
      return next(new AppError("Role name is required for update", 400));
    }

    const updatedUser = await adminModel.updateUserByRoleName(userId, role_name);
    if (!updatedUser) {
      logger.warn(`Update user role failed: User with ID ${userId} not found`);
      return next(new AppError(`User with ID ${userId} not found`, 404));
    }
    logger.info(`User role updated for user ID ${userId} to role ${role_name}`);
    res.status(200).json({
      status: "success",
      message: "User role updated successfully",
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