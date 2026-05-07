/**
 * routes/auth.js
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * GET  /api/auth/me
 * POST /api/auth/logout
 */

const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

// Register
router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  ctrl.register,
);

// Login
router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login,
);

// Refresh token
router.post('/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validate,
  ctrl.refresh,
);

// Get current user
router.get('/me', authenticate, ctrl.me);

// Logout
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
