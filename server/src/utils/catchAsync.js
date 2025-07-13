// Wraps an asynchronous function to catch errors and pass them to the next middleware
module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res,
next)).catch(next); };