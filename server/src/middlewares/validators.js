const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};


// User registration validators
const userValidationRules = () => {
    return [
        body('username')
            .trim()
            .isLength({ min: 3, max: 20 })
            .withMessage('Username must be between 3 and 20 characters')
            .matches(/^[a-zA-Z0-9]+$/)
            .withMessage('Username must contain only letters and numbers'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
            .withMessage('Password must contain at least one letter, one number, and one special character'),
    ];
};

// Quiz Feature Validators

// Validators for creating/updating a Question
const questionValidationRules = () => {
    return [
        body('questionText')
            .trim()
            .notEmpty()
            .withMessage('Question text cannot be empty.')
            .isString()
            .withMessage('Question text must be a string.')
            .isLength({ max: 100 }) 
            .withMessage('Question text cannot exceed 100 characters.'),
    ];
};

const activityValidationRules = () => {
    return [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Activity name is required.')
            .isString()
            .withMessage('Activity name must be a string.')
            .isLength({ max: 100 })
            .withMessage('Activity name cannot exceed 100 characters.'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('Activity description is required.')
            .isString()
            .withMessage('Activity description must be a string.')
            .isLength({ max: 500 })
            .withMessage('Activity description cannot exceed 500 characters.'),
        body('route')
            .optional()
            .trim()
            .matches(/^\/[a-zA-Z0-9-_/:]*$/)
            .withMessage('Route must start with "/" and contain only letters, numbers, hyphens, underscores, or colons.'),
    ];
};

const rewardValidationRules = () => {
  return [
    body('qrToken').optional().isString().notEmpty().withMessage('QR token must be a non-empty string'),
    query('qrToken').optional().isString().notEmpty().withMessage('QR token must be a non-empty string'),
  ];
};

module.exports = { rewardValidationRules };


module.exports = {
    validate,
    userValidationRules,
    questionValidationRules,
    activityValidationRules,
    rewardValidationRules,
};
