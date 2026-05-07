/**
 * middleware/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * JWT-based authentication and role-based authorisation middleware.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const jwt     = require('jsonwebtoken');
const config  = require('../config/config');
const storage = require('../services/storageService');

/**
 * authenticate — Verifies the Bearer token in the Authorization header.
 * On success, attaches `req.user` and `req.token`.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a valid Bearer token.',
      });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Verify user still exists and is active
    const user = storage.getUserById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User account not found or deactivated.' });
    }

    req.user  = { id: user.id, username: user.username, email: user.email, role: user.role };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }
    next(err);
  }
}

/**
 * authorise — Role guard factory.
 * Usage:  router.delete('/logs', authenticate, authorise('admin'), handler)
 * @param {...string} roles - allowed roles
 */
function authorise(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}

/**
 * optionalAuth — Attaches user info if token is present but doesn't block if missing.
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret);
      const user    = storage.getUserById(decoded.id);
      if (user && user.isActive) {
        req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
      }
    }
  } catch (_) { /* ignore */ }
  next();
}

module.exports = { authenticate, authorise, optionalAuth };
