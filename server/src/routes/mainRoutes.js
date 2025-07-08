//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const bcryptMiddleware = require('../middlewares/bcryptMiddleware.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const userController = require('../controllers/userController.js');

//////////////////////////////////////////////////////
// IMPORT MIDDLEWARES FOR INPUT VALIDATION
//////////////////////////////////////////////////////
const {
  validate, 
  userValidationRules
} = require('../middlewares/validators.js');

const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest);

//////////////////////////////////////////////////////
// DEFINE ROUTES
//////////////////////////////////////////////////////
// [POST] User login 
router.post(
  "/login",
  userValidationRules(), // Apply validation rules for user-related fields
  validate, // Check validation results
  userController.login,
  bcryptMiddleware.comparePassword,
  jwtMiddleware.generateTokens,
  (req, res) => {
    res.status(200).json({
      message: "Login successful",
      user: {
        user_id: res.locals.user_id,
        username: res.locals.username,
        role_id: res.locals.role_id,
      }
    });
  }
);

// [POST] User register
router.post(
  "/register",
  userValidationRules(), // Apply validation rules for user-related fields
  validate, // Check validation results
  userController.checkUsernameExist,
  bcryptMiddleware.hashPassword,
  userController.register,
  jwtMiddleware.generateTokens,
  (req, res) => {
    res.status(201).json({
      message: "Registration successful",
      user: {
        user_id: res.locals.user_id,
        username: res.locals.username,
        role_id: res.locals.role_id,
      }
    });
  }
);


router.get('/me', jwtMiddleware.verifyAccessToken, (req, res) => {
  const user = {
    user_id: req.user.user_id,
    username: req.user.username,
    role_id: req.user.role_id,
  };
  res.status(200).json(user);
});

// [POST] Logout route to clear the cookie
router.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

// [POST] Refresh token route
router.post("/refresh", jwtMiddleware.refreshTokenHandler);

const quizRoutes = require('../routes/quizRoutes.js');
router.use('/quiz', quizRoutes);

// routes for admin to manage user
const adminRoutes = require('../routes/adminRoutes.js');
router.use('/admin', adminRoutes);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;