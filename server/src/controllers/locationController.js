const logger = require("../logger.js");
const adminModel = require("../models/adminModel.js");
const { getLocationById, getAllLocations } = require("../models/locationModel.js");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

module.exports = {
    
    getLocationById: catchAsync(async (req, res, next) => {
        const { locationId } = req.params;
        if (!locationId) {
            logger.warn("Fetch location by ID failed: Missing location ID");
            return next(new AppError("Location ID is required", 400));
        }

        const location = await getLocationById(locationId);
        if (!location) {
            logger.warn(`Fetch location by ID failed: Location with ID ${locationId} not found`);
            return next(new AppError(`Location with ID ${locationId} not found`, 404));
        }
        logger.debug(`Fetched location with ID ${locationId}`);
        res.status(200).json({ status: "success", data: location });
    }),

    getAllLocations: catchAsync(async (req, res, next) => {
        const locations = await getAllLocations();
        if (!locations || locations.length === 0) {
            logger.warn("Fetch all locations failed: No locations found");
            return next(new AppError("No locations found", 404));
        }
        logger.debug("Fetched all locations");
        res.status(200).json({ status: "success", data: locations });
    }),
    
}