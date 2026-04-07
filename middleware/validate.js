const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors.
 * Place after validation chains in the route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// --- Validation chains ---

const registerValidation = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .escape(),
  body('role')
    .optional()
    .isIn(['admin', 'engineer', 'viewer']).withMessage('Invalid role'),
  validate
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

const faultValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Fault title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters')
    .escape(),
  body('type')
    .isIn(['structural', 'electrical', 'mechanical', 'wear', 'safety', 'other'])
    .withMessage('Invalid fault type'),
  body('severity')
    .isIn(['critical', 'high', 'medium', 'low'])
    .withMessage('Invalid severity level'),
  body('location.area')
    .trim()
    .notEmpty().withMessage('Fault location area is required')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters')
    .escape(),
  validate
];

const annotationValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Annotation text is required')
    .isLength({ max: 500 }).withMessage('Annotation must be under 500 characters')
    .escape(),
  validate
];

const toolCheckValidation = [
  body('checkType')
    .isIn(['pre_shift', 'post_shift', 'spot_check'])
    .withMessage('Invalid check type'),
  body('detectedTools')
    .isArray().withMessage('detectedTools must be an array'),
  body('detectedTools.*.name')
    .trim()
    .notEmpty().withMessage('Tool name is required'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  faultValidation,
  annotationValidation,
  toolCheckValidation
};
