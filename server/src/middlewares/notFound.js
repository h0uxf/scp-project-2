// Checks if the requested resource is not found and returns a 404 error
const AppError = require("../utils/AppError");

module.exports = (req, res, next) => {
    next(new AppError(`Resource not found - ${req.originalUrl}`, 404)); };