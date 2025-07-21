// REQUIRED MODULES
const express = require('express');

// IMPORT CONTROLLERS
const adminController = require('../controllers/adminController.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const roleMiddleware = require('../middlewares/roleMiddleware.js');

// IMPORT MIDDLEWARES FOR INPUT VALIDATION
const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');
const locationController = require('../controllers/locationController.js');

// CREATE ROUTER
const router = express.Router();
router.use(sanitizeRequest); 

// DEFINE ROUTES
// [GET] Fetch location by ID
router.get(
    '/:locationId',
    // jwtMiddleware.verifyToken, // Ensure the user is authenticated
    // roleMiddleware.checkRole(['admin', 'user']), // Check if the user has the required role
    locationController.getLocationById, // Call the controller method to handle the request
    sanitizeResponse // Sanitize the response before sending it
);

// [GET] Fetch all locations
router.get(
    '/',
    // jwtMiddleware.verifyToken, // Ensure the user is authenticated
    // roleMiddleware.checkRole(['admin', 'user']), // Check if the user has the required role
    locationController.getAllLocations, // Call the controller method to handle the request
    sanitizeResponse // Sanitize the response before sending it
);

module.exports = router;