// controllers/leaderboardController.js
const logger = require("../logger.js");
const leaderboardModel = require("../models/leaderboardModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  get100Players: catchAsync(async (req, res, next) => {
    let players = await leaderboardModel.read100Users();

    if (!players || players.length === 0) {
      logger.warn("No player was found");
      return next(new AppError("No player was found", 404));
    }

    // sort by points
    players.sort((a, b) => b.points - a.points);

    logger.debug("Fetching all players sorted by points");
    res.status(200).json({ status: "success", data: players });
  }),

  getUserInfo: catchAsync(async (req, res, next) => {
    const userId = req.user?.user_id;
    if (!userId) {
      logger.warn("Fetch user by ID failed: Missing user ID");
      return next(new AppError("User ID is required", 400));
    }

    const [user, sortedUsers] = await Promise.all([
      leaderboardModel.readUserById(userId),
      leaderboardModel.readAllUsersSorted(),
    ]);

    if (!user) {
      logger.warn(`Fetch user by ID failed: User with ID ${userId} not found`);
      return next(new AppError(`User with ID ${userId} not found`, 404));
    }

    const rank = sortedUsers.findIndex((u) => u.userId === user.userId) + 1;

    logger.debug(`Fetched user with ID ${userId} and rank ${rank}`);

    res.status(200).json({
      status: "success",
      data: {
        ...user,
        rank,
      },
    });
  }),
};
