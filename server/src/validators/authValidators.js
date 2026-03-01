import { body } from 'express-validator';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('displayName')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isLength({ max: 80 }).withMessage('Display name too long'),
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isString()
    .matches(passwordPattern).withMessage('Password must be 8+ characters with letters and numbers'),
  body('role')
    .optional()
    .isIn(['brand', 'influencer', 'user']).withMessage('Role must be brand, influencer, or user'),
  body('biography')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Biography too long'),
];

export const loginRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or username is required'),
  body('password')
    .isString()
    .notEmpty().withMessage('Password is required'),
];
