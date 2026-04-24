const express = require("express");
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');
const {
  signupHandler,
  loginHandler,
  getCurrentUserHandler,
  refreshTokenHandler,
  updateProfileHandler,
  changePasswordHandler
} = require("../handlers/aouthHandlers");

// Validation rules
const signupValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/signup', signupValidation, handleValidationErrors, signupHandler);
router.post('/login', loginValidation, handleValidationErrors, loginHandler);
router.post('/refresh-token', refreshTokenHandler);

// Protected routes (require authentication)
router.get('/me', authenticateToken, getCurrentUserHandler);
router.put('/profile', authenticateToken, updateProfileHandler);
router.put('/change-password', authenticateToken, changePasswordHandler);

module.exports = router;
