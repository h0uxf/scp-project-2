const logger = require("../logger.js");
const activityModel = require("../models/activityModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
    // Public activity endpoints
    getAllActivities: catchAsync(async (req, res, next) => {
        const activities = await activityModel.getAllActivities();
        if (!activities || activities.length === 0) {
            logger.warn("No activities found");
            return next(new AppError("No activities found", 404));
        }
        logger.debug("Fetching all activities");
        res.status(200).json({ status: "success", data: activities });
    }),

    getActivityById: catchAsync(async (req, res, next) => {
        const { activityId } = req.params;
        if (!activityId) {
            logger.warn("Fetch activity by ID failed: Missing activity ID");
            return next(new AppError("Activity ID is required", 400));
        }
        const activity = await activityModel.getActivityById(activityId);
        if (!activity) {
            logger.warn(`Activity with ID ${activityId} not found`);
            return next(new AppError(`Activity with ID ${activityId} not found`, 404));
        }
        logger.debug(`Fetching activity with ID ${activityId}`);
        res.status(200).json({ status: "success", data: activity });
    }),

    // Admin activity endpoints
    createActivity: catchAsync(async (req, res, next) => {
        const { name, description, route } = req.body;
        if (!name || !description) {
            logger.warn("Create activity failed: Missing name or description");
            return next(new AppError("Name and description are required", 400));
        }

        const newActivity = await activityModel.createActivity({
            name,
            description,
            route: route || null,
        });
        res.status(201).json({ status: "success", data: newActivity });
    }),

    updateActivity: catchAsync(async (req, res, next) => {
        const { activityId } = req.params;
        const { name, description, route } = req.body;
        if (!activityId) {
            logger.warn("Update activity failed: Missing activity ID");
            return next(new AppError("Activity ID is required", 400));
        }
        if (!name || !description) {
            logger.warn(`Update activity ${activityId} failed: Missing name or description`);
            return next(new AppError("Name and description are required", 400));
        }

        const updatedActivity = await activityModel.updateActivity(activityId, {
            name,
            description,
            route: route || null,
        });
        if (!updatedActivity) {
            logger.warn(`Update activity ${activityId} failed: Activity not found`);
            return next(new AppError(`Activity with ID ${activityId} not found`, 404));
        }
        res.status(200).json({ status: "success", data: updatedActivity });
    }),

    deleteActivity: catchAsync(async (req, res, next) => {
        const { activityId } = req.params;
        if (!activityId) {
            logger.warn("Delete activity failed: Missing activity ID");
            return next(new AppError("Activity ID is required", 400));
        }

        const activity = await activityModel.getActivityById(activityId);
        if (!activity) {
            logger.warn(`Delete activity ${activityId} failed: Activity not found`);
            return next(new AppError(`Activity with ID ${activityId} not found`, 404));
        }

        await activityModel.deleteActivity(activityId);
        res.status(200).json({ status: "success", data: activity });
    }),

    reorderActivities: catchAsync(async (req, res, next) => {
        const { activities } = req.body;
        if (!Array.isArray(activities) || activities.length === 0) {
            logger.warn("Reorder activities failed: Invalid activities array");
            return next(new AppError("Activities must be a non-empty array", 400));
        }

        // Validate integer IDs
        const parsedIds = activities.map((activity) => parseInt(activity.activityId, 10));
        if (parsedIds.some((id) => isNaN(id))) {
            logger.warn("Reorder activities failed: Non-integer activity IDs");
            return next(new AppError("All activity IDs must be integers", 400));
        }

        const reorderedActivities = await activityModel.reorderActivities(activities);
        res.status(200).json({ status: "success", data: reorderedActivities });
    }),

    checkCompletion: catchAsync(async (req, res, next) => {
        const userId = res.locals.user_id;

        if (!userId) {
        logger.warn("Check completion failed: Missing user ID");
        return next(new AppError("User ID is required", 400));
        }

        try {
        const completionStatus = await activityModel.checkCompletion(userId);
        logger.debug(`Completion check successful for user ID ${userId}`);
        res.status(200).json({
            status: "success",
            data: completionStatus,
        });
        } catch (error) {
        logger.error(`Error checking completion for user ID ${userId}: ${error.message}`);
        if (error.message.includes("No activities found")) {
            return next(new AppError("No activities found in the system", 404));
        }
        if (error.message.includes("Invalid user ID")) {
            return next(new AppError("Invalid user ID", 400));
        }
        return next(new AppError(`Failed to check completion: ${error.message}`, 500));
        }
    }),
};