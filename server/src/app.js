const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const { sanitizeResponse } = require('./middlewares/sanitizers');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

//////////////////////////////////////////////////////
// CORS CONFIGURATION
//////////////////////////////////////////////////////
const allowedOrigins = (process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'https://kh24.8thwall.app',
  'https://kahhian24-default-kh24.dev.8thwall.app',
]).map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked for invalid origin', { origin });
        callback(new Error('Not allowed by CORS'));
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
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);

// CSRF Protection Setup
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Rate limit for CSRF token endpoint
const csrfTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  handler: (req, res, next) => {
    const error = new Error('Too many CSRF token requests, please try again later');
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF Token Endpoint
app.get('/api/csrf-token', csrfTokenLimiter, csrfProtection, (req, res) => {
  try {
    const token = req.csrfToken();
    res.json({ csrfToken: token });
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error: error.message, stack: error.stack });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate CSRF token',
    });
  }
});

// Selective CSRF Protection for other API routes
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  if (
    (req.path === '/login' ||
      req.path === '/register' ||
      req.path === '/images/upload') &&
    req.method === 'POST'
  ) {
    return next();
  }
  csrfProtection(req, res, (err) => {
    if (err) {
      logger.error('CSRF validation failed', {
        path: req.originalUrl,
        method: req.method,
        error: err.message,
        stack: err.stack,
      });
      return res.status(403).json({
        status: 'error',
        message: 'Invalid CSRF token',
      });
    }
    next();
  });
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  handler: (req, res, next) => {
    const error = new Error("Too many requests from this IP for admin roles, please try again after 1 minute");
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const advancedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  handler: (req, res, next) => {
    const error = new Error("Too many requests from this IP, please try again after 1 minute");
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  handler: (req, res, next) => {
    const error = new Error("Too many requests from this IP, please try again after 1 minute");
    error.statusCode = 429;
    next(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  const userRole = res.locals?.role_id || 'user';
  switch (userRole) {
    case 'super_admin':
    case 'admin':
      adminLimiter(req, res, next);
      break;
    case 'content_manager':
    case 'moderator':
      advancedLimiter(req, res, next);
      break;
    default:
      generalLimiter(req, res, next);
  }
});

//////////////////////////////////////////////////////
// LOGGING MIDDLEWARE
//////////////////////////////////////////////////////
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      user: req.user?.username || 'anonymous',
    });
  });
  next();
});

//////////////////////////////////////////////////////
// API ROUTES
//////////////////////////////////////////////////////
const mainRoutes = require('./routes/mainRoutes');
app.use('/api', mainRoutes);

//////////////////////////////////////////////////////
// STATIC FILES
//////////////////////////////////////////////////////
app.use('/', express.static('public'));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//////////////////////////////////////////////////////
// RESPONSE SANITIZATION & ERROR HANDLING
//////////////////////////////////////////////////////
app.use(sanitizeResponse);
app.use(notFound);
app.use(errorHandler);

module.exports = app;