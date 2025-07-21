//////////////////////////////////////////////////////
// REQUIRED MODULES
//////////////////////////////////////////////////////
const express = require('express');

//////////////////////////////////////////////////////
// IMPORT CONTROLLERS
//////////////////////////////////////////////////////
const activityController = require('../controllers/activityController.js');
const jwtMiddleware = require('../middlewares/jwtMiddleware.js');
const roleMiddleware = require('../middlewares/roleMiddleware.js');

//////////////////////////////////////////////////////
// IMPORT MIDDLEWARES FOR INPUT VALIDATION
//////////////////////////////////////////////////////
const { sanitizeRequest, sanitizeResponse } = require('../middlewares/sanitizers.js');
const { activityValidationRules, validate } = require('../middlewares/validators.js');

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();
router.use(sanitizeRequest); 

//////////////////////////////////////////////////////

// DEFINE ROUTES FOR MANAGING ACTIVITIES (ADMIN)
//////////////////////////////////////////////////////
// [PUT] Reorder activities
router.put(
    '/reorder',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware([3, 4, 5]),
    activityController.reorderActivities
);
// [GET] Get all activities
router.get(
    '/',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware([3, 4, 5]),
    activityController.getAllActivities
);

// [GET] Get activity by ID
router.get(
    '/:activityId',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware([3, 4, 5]),
    activityController.getActivityById
);

// [POST] Create a new activity
router.post(
    '/',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware([3, 4, 5]),
    activityValidationRules(),
    validate,
    activityController.createActivity
);

// [PUT] Update an existing activity
router.put(
    '/:activityId',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware([3, 4, 5]),
    activityValidationRules(),
    validate,
    activityController.updateActivity
);

// [DELETE] Delete an activity
router.delete(
    '/:activityId',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware([3, 4, 5]),
    activityController.deleteActivity
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;