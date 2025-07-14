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
            .isLength({ max: 500 }) // Example max length
            .withMessage('Question text cannot exceed 500 characters.'),
    ];
};

// Validators for creating/updating an Option
const optionValidationRules = (prisma) => { 
    return [
        body('optionText')
            .trim()
            .notEmpty()
            .withMessage('Option text cannot be empty.')
            .isString()
            .withMessage('Option text must be a string.')
            .isLength({ max: 255 }) 
            .withMessage('Option text cannot exceed 255 characters.'),
        body('questionId')
            .isInt({ gt: 0 })
            .withMessage('Question ID must be a positive integer.')
            .custom(async (value) => {
                if (!prisma) {
                    console.warn("Prisma client not provided to optionValidationRules. Skipping DB check for questionId.");
                    return true;
                }
                const question = await prisma.question.findUnique({
                    where: { questionId: value },
                });
                if (!question) {
                    throw new Error('Question with the provided ID does not exist.');
                }
                return true;
            }),
        body('personalityId')
            .optional({ nullable: true })
            .isInt({ gt: 0 })
            .withMessage('Personality ID must be a positive integer if provided.')
            .custom(async (value) => {
                if (value === null || value === undefined) return true; 
                if (!prisma) {
                    console.warn("Prisma client not provided to optionValidationRules. Skipping DB check for personalityId.");
                    return true;
                }
                const personalityType = await prisma.personalityType.findUnique({
                    where: { id: value },
                });
                if (!personalityType) {
                    throw new Error('Personality type with the provided ID does not exist.');
                }
                return true;
            }),
    ];
};

// Validators for submitting a QuizResult
const quizResultValidationRules = (prisma) => { 
    return [
        body('userId')
            .isInt({ gt: 0 })
            .withMessage('User ID must be a positive integer.')
            .custom(async (value) => {
                if (!prisma) {
                    console.warn("Prisma client not provided to quizResultValidationRules. Skipping DB check for userId.");
                    return true;
                }
                const user = await prisma.user.findUnique({
                    where: { userId: value },
                });
                if (!user) {
                    throw new Error('User with the provided ID does not exist.');
                }
                return true;
            }),
        body('questionId')
            .isInt({ gt: 0 })
            .withMessage('Question ID must be a positive integer.')
            .custom(async (value) => {
                if (!prisma) {
                    console.warn("Prisma client not provided to quizResultValidationRules. Skipping DB check for questionId.");
                    return true;
                }
                const question = await prisma.question.findUnique({
                    where: { questionId: value },
                });
                if (!question) {
                    throw new Error('Question with the provided ID does not exist.');
                }
                return true;
            }),
        body('optionId')
            .isInt({ gt: 0 })
            .withMessage('Option ID must be a positive integer.')
            .custom(async (optionId, { req }) => {
                const { questionId } = req.body;
                if (!prisma) {
                    console.warn("Prisma client not provided to quizResultValidationRules. Skipping DB check for optionId.");
                    return true;
                }
                // Check if the option exists and belongs to the given question
                const option = await prisma.option.findFirst({
                    where: {
                        optionId: optionId,
                        questionId: questionId, // Crucial check
                    },
                });
                if (!option) {
                    throw new Error('Selected option does not exist or does not belong to the provided question.');
                }
                return true;
            }),
    ];
};


module.exports = {
    validate,
    userValidationRules,
    questionValidationRules,
    optionValidationRules,
    quizResultValidationRules,
};
