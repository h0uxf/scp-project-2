// controllers/userController.js
const express = require("express");
const userModel = require("../models/userModel.js");
const logger = require("../logger.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  login: catchAsync(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      logger.warn("Login failed: Missing username or password");
      return next(new AppError("Missing username or password", 400));
    }

    const data = { username, password };
    const results = await userModel.selectByUsernameAndPassword(data);
    if (!results) {
      logger.warn(`Login failed: Username ${data.username} does not exist`);
      return next(new AppError(`Username ${data.username} does not exist`, 404));
    }

    logger.debug(`User ${data.username} logged in successfully`);
    res.locals.user_id = results.userId;
    res.locals.username = results.username;
    res.locals.hash = results.passwordHash;
    res.locals.role_id = results.role[0]?.roleId || null;
    res.locals.role_name = results.role.roleName; 
    next();
  }),

  register: catchAsync(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      logger.warn("Registration failed: Missing username or password");
      return next(new AppError("Missing username or password", 400));
    }

    const data = { username, password };
    const results = await userModel.createNewUser(data);
    if (!results) {
      logger.warn(`User registration failed for username ${data.username}`);
      return next(new AppError("User registration failed", 500));
    }

    logger.info(`User ${data.username} successfully created`);
    res.locals.message = `User ${data.username} successfully created`;
    res.locals.user_id = results.userId;
    res.locals.username = results.username;
    res.locals.role_id = results.role.length > 0 ? results.role[0].roleId : null;
    res.locals.role_name = results.role.roleId; 
    next();
  }),

  checkUsernameExist: catchAsync(async (req, res, next) => {
    const { username } = req.body;
    if (!username) {
      logger.warn("Username check failed: Missing username");
      return next(new AppError("Missing username", 400));
    }

    const data = { username };
    const results = await userModel.selectByUsernameAndPassword(data);
    if (results && Array.isArray(results) && results.length > 0) {
      logger.warn(`Username check failed: Username ${username} already exists`);
      return next(new AppError("Username already exists. Please try another username", 409));
    }

    logger.debug(`Username ${username} is available`);
    next();
  }),

  readLoggedInPlayer: catchAsync(async (req, res, next) => {
    const user_id = res.locals.user_id;
    if (!user_id) {
      logger.warn("Read logged in player failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    const data = { user_id };
    const results = await userModel.readLoggedInUser(data);
    if (!results) {
      logger.warn(`Read logged in player failed: User ${user_id} does not exist`);
      return next(new AppError(`User ${user_id} does not exist`, 404));
    }

    logger.debug(`Retrieved logged in player data for user: ${user_id}`);
    res.status(200).json({ status: "success", data: results });
  }),
};