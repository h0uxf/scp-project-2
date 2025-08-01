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
router.get(
    '/check-completion', 
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityController.checkCompletion
);

// [PUT] Reorder activities
router.put(
    '/reorder',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityController.reorderActivities
);
// [GET] Get all activities
router.get(
    '/',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityController.getAllActivities
);

// [GET] Get activity by ID
router.get(
    '/:activityId',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityController.getActivityById
);

// [POST] Create a new activity
router.post(
    '/',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityValidationRules(),
    validate,
    activityController.createActivity
);

// [PUT] Update an existing activity
router.put(
    '/:activityId',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityValidationRules(),
    validate,
    activityController.updateActivity
);

// [DELETE] Delete an activity
router.delete(
    '/:activityId',
    jwtMiddleware.verifyAccessToken,
    roleMiddleware(["content_manager", "moderator", "admin", "super_admin" ]),
    activityController.deleteActivity
);

//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
router.use(sanitizeResponse);
module.exports = router;