const logger = require("../logger");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500; // Default to 500 if undefined
  const status = err.status || (statusCode >= 400 && statusCode < 500 ? "fail" : "error");

  let response = {
    status,
    message: err.message || "An unexpected error occurred",
  };

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    response = { status: "fail", message: "Invalid JSON body" };
  }

  logger.error("Error occurred", {
    message: response.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};