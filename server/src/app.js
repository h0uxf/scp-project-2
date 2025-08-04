const express = require("express");
const cors = require("cors");
const logger = require("./logger");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const { sanitizeResponse } = require("./middlewares/sanitizers");

const app = express();
app.set('trust proxy', 1);

//////////////////////////////////////////////////////
// CORS CONFIGURATION
//////////////////////////////////////////////////////
const allowedOrigins = [
  "http://localhost:5173",
  "https://kh24.8thwall.app",
  "https://kahhian24-default-kh24.dev.8thwall.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn("CORS blocked for invalid origin", { origin });
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//////////////////////////////////////////////////////
// SECURITY MIDDLEWARE
//////////////////////////////////////////////////////
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for frontend compatibility
    imgSrc: ["'self'", "data:"], // Allow data URLs for images
    connectSrc: ["'self'", ...allowedOrigins], // Allow frontend origins for API calls
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));

// CSRF Protection Setup
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Apply CSRF middleware to the token endpoint specifically
app.use('/api/csrf-token', csrfProtection);

// CSRF Token Endpoint - Now middleware has run and req.csrfToken() is available
app.get('/api/csrf-token', (req, res) => {
  try {
    const token = req.csrfToken();
    res.json({ csrfToken: token });
  } catch (error) {
    logger.error("Failed to generate CSRF token", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Failed to generate CSRF token" 
    });
  }
});

// Selective CSRF Protection for other API routes
app.use('/api', (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for login/register (first-time visitors won't have token)
  if ((req.path === '/login' || req.path === '/register') && req.method === 'POST') {
    return next();
  }
  
  // Apply CSRF protection to other POST/PUT/DELETE requests
  csrfProtection(req, res, (err) => {
    if (err) {
      logger.error("CSRF validation failed", { 
        path: req.originalUrl, 
        method: req.method,
        error: err.message 
      });
      return res.status(403).json({ 
        status: "error", 
        message: "Invalid CSRF token" 
      });
    }
    next();
  });
});

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: (req, res, next) => {
    const error = new Error("Too many requests from this IP, please try again after 15 minutes");
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint-specific rate limiter for high-traffic GET endpoints
const leaderboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Higher limit for leaderboard
  handler: (req, res, next) => {
    const error = new Error("Too many leaderboard requests, please try again later");
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/leaderboard', leaderboardLimiter);
app.use(generalLimiter);

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
      user: req.user?.username || "anonymous",
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
// STATIC FILES
//////////////////////////////////////////////////////
app.use("/", express.static("public"));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

//////////////////////////////////////////////////////
// RESPONSE SANITIZATION & ERROR HANDLING
//////////////////////////////////////////////////////
app.use(sanitizeResponse);
app.use(notFound);
app.use(errorHandler);

module.exports = app;