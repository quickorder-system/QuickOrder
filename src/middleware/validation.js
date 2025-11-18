const { body, validationResult } = require('express-validator');

const validateOrder = [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('contactNumber')
    .notEmpty().withMessage('Contact number is required')
    .matches(/^09\d{9}$/).withMessage('Contact number must be 11 digits starting with 09'),
  body('address').notEmpty().withMessage('Address is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateRegistration = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .custom((value) => {
      if (['admin', 'owner'].includes(value.toLowerCase())) {
        throw new Error('This username is reserved and cannot be used');
      }
      return true;
    }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateOrder,
  validateRegistration,
  validateLogin,
};
