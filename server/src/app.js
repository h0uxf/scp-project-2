//////////////////////////////////////////////////////
// UPDATED APP.JS WITH PROPER CSRF HANDLING
//////////////////////////////////////////////////////
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
  origin: allowedOrigins,
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
    styleSrc: ["'self'"],
    imgSrc: ["'self'"],
    connectSrc: ["'self'"],
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
    sameSite: 'strict'
  }
});

// Apply CSRF protection to state-changing operations only
app.use('/api', (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Apply CSRF protection for POST, PUT, DELETE, PATCH
  csrfProtection(req, res, next);
});

// Endpoint to get CSRF token for frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res, next) => {
    const error = new Error("Too many requests from this IP, please try again after 15 minutes");
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

//////////////////////////////////////////////////////
// CSRF TOKEN ENDPOINT (NO CSRF PROTECTION)
//////////////////////////////////////////////////////
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

//////////////////////////////////////////////////////
// SELECTIVE CSRF PROTECTION
//////////////////////////////////////////////////////
app.use('/api', (req, res, next) => {
  // Skip CSRF for safe methods and specific auth endpoints
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for initial login (but require it after login)
  if (req.path === '/login' && req.method === 'POST') {
    return next();
  }
  
  // Skip CSRF for registration
  if (req.path === '/register' && req.method === 'POST') {
    return next();
  }
  
  // Apply CSRF protection for all other state-changing operations
  csrfProtection(req, res, next);
});

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
// STATIC FILES
//////////////////////////////////////////////////////
app.use("/", express.static("public"));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//////////////////////////////////////////////////////
// RESPONSE SANITIZATION & ERROR HANDLING
//////////////////////////////////////////////////////
app.use(sanitizeResponse);
app.use(notFound);
app.use(errorHandler);

module.exports = app;