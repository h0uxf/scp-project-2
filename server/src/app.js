//////////////////////////////////////////////////////
// INCLUDES
//////////////////////////////////////////////////////
const express = require("express");
const cors = require("cors");
const logger = require("./logger");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { sanitizeResponse } = require("./middlewares/sanitizers");

//////////////////////////////////////////////////////
// CREATE APP
//////////////////////////////////////////////////////
const app = express();

// Trust proxy for correct IP handling (dev. port forwarding)
app.set('trust proxy', 1);

//////////////////////////////////////////////////////
// USES
//////////////////////////////////////////////////////

const allowedOrigins = [
  "http://localhost:5173",
  "https://kh24.8thwall.app",
  "https://kahhian24-default-kh24.dev.8thwall.app",
  "http://192.168.31.124:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//////////////////////////////////////////////////////
// SECURITY MIDDLEWARE
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  handler: (req, res, next) => {
    next(new AppError("Too many requests from this IP, please try again after 15 minutes", 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

//////////////////////////////////////////////////////
// LOGGING MIDDLEWARE
//////////////////////////////////////////////////////
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    logger.info("Request processed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
    });
  });
  next();
});

//////////////////////////////////////////////////////
// API ROUTES
//////////////////////////////////////////////////////
const mainRoutes = require("./routes/mainRoutes");
app.use("/api", mainRoutes);

//////////////////////////////////////////////////////
// SETUP STATIC FILES
//////////////////////////////////////////////////////
app.use("/", express.static("public"));

// Serve uploaded images statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//////////////////////////////////////////////////////
// RESPONSE SANITIZATION
//////////////////////////////////////////////////////
app.use(sanitizeResponse);

//////////////////////////////////////////////////////
// ERROR HANDLING
//////////////////////////////////////////////////////
app.use(notFound); // Handle unmatched routes
app.use(errorHandler); // Handle all errors

//////////////////////////////////////////////////////
// EXPORT APP
//////////////////////////////////////////////////////
module.exports = app;