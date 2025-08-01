// This class extends the built-in Error class to create custom errors for the application
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); this.statusCode
        = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;