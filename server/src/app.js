//////////////////////////////////////////////////////
// INCLUDES
//////////////////////////////////////////////////////
const express = require("express");
const cors = require("cors");
const logger = require("./logger"); // logger for logging requests and errors

//////////////////////////////////////////////////////
// CREATE APP
//////////////////////////////////////////////////////
const app = express();

//////////////////////////////////////////////////////
// USES
//////////////////////////////////////////////////////
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { sanitizeResponse } = require("../src/middlewares/sanitizers");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit"); // for rate limiting

const cookieParser = require("cookie-parser");
app.use(cookieParser());
//////////////////////////////////////////////////////
// SETUP STATIC FILES
//////////////////////////////////////////////////////
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});
app.use(limiter); // rate limiting to all requests

//////////////////////////////////////////////////////
// Logging Middleware
//////////////////////////////////////////////////////
app.
  use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const responeTime = Date.now() - start;
      logger.info("Request processed", {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responeTime}ms`,
        ip: req.ip,
      });
    });

    next();
  });
//////////////////////////////////////////////////////
// ERROR HANDLING
//////////////////////////////////////////////////////
// app.use((req, res, next) => {
//   res.status(404).json({
//     error: "Not Found",
//     message: "The requested resource could not be found.",
//   });
// });

// app.use((err, req, res, next) => {
//   logger.error("Error occurred", {
//     message: err.message,
//     stack: err.stack,
//     method: req.method,
//     path: req.path,
//   });

//   res.status(500).json({
//     error: "Internal Server Error",
//     message: "An unexpected error occurred. Please try again later.",
//   });
// });

//////////////////////////////////////////////////////
// API ROUTES
//////////////////////////////////////////////////////
const mainRoutes = require("./routes/mainRoutes");
app.use("/api", mainRoutes);

app.use("/", express.static("public"));
app.use(sanitizeResponse);

//////////////////////////////////////////////////////
// EXPORT APP
//////////////////////////////////////////////////////
module.exports = app;
