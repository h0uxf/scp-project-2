//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const adminController = require('../controllers/adminController.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const roleMiddleware = require('../middlewares/roleMiddleware.js');

//////////////////////////////////////////////////////
// IMPORT MIDDLEWARES FOR INPUT VALIDATION
//////////////////////////////////////////////////////
const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest); 

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR MANAGING USERS (ADMIN)
//////////////////////////////////////////////////////
// [GET] Get all users
router.get(
    '/users',
    jwtMiddleware.verifyToken,
    roleMiddleware([4, 5]),
    adminController.getAllUsers
);

// [GET] Get user by ID
router.get(
    '/users/:userId',
    jwtMiddleware.verifyToken,
    roleMiddleware([4, 5]),
    adminController.getUserById
);

// [PUT] Update user by ID
router.put(
    '/users/:userId',
    jwtMiddleware.verifyToken,
    roleMiddleware([4, 5]),
    adminController.updateUserById
);

// [DELETE] Delete user by ID
router.delete(
    '/users/:userId',
    jwtMiddleware.verifyToken,
    roleMiddleware([4, 5]),
    adminController.deleteUserById
);

//////////////////////////////////////////////////////
// DEFINE ROUTES FOR USER STATISTICS (ADMIN)
//////////////////////////////////////////////////////
// [GET] Get user statistics
router.get(
    '/statistics',
    jwtMiddleware.verifyToken,
    roleMiddleware([4, 5]),
    adminController.getUserStatistics
);


//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;