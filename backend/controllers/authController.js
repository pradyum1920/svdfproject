/**
 * controllers/authController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: POST /api/auth/register
 *          POST /api/auth/login
 *          POST /api/auth/refresh
 *          GET  /api/auth/me
 *          POST /api/auth/logout   (client-side, but we log it)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config  = require('../config/config');
const storage = require('../services/storageService');

// ── Helpers ───────────────────────────────────────────────────────────────────

function signAccess(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function signRefresh(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
}

function safeUser(u) {
  const { password, ...safe } = u;  // eslint-disable-line no-unused-vars
  return safe;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { username, email, password, role? }
 */
async function register(req, res, next) {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Duplicate checks
    if (storage.getUserByUsername(username)) {
      return res.status(409).json({ success: false, error: 'Username already taken.' });
    }
    if (storage.getUserByEmail(email)) {
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    // Only admins can create admin accounts
    const validRole = role === 'admin' ? 'user' : role;  // promote via admin panel only

    const hashed = await bcrypt.hash(password, 10);
    const user   = {
      id:        uuidv4(),
      username,
      email,
      password:  hashed,
      role:      validRole,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive:  true,
    };

    storage.saveUser(user);

    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user:    safeUser(user),
      token:   signAccess(tokenPayload),
      refreshToken: signRefresh(tokenPayload),
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const user = storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account is deactivated.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Update lastLogin
    storage.saveUser({ ...user, lastLogin: new Date().toISOString() });

    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    return res.json({
      success: true,
      message: 'Login successful.',
      user:    safeUser({ ...user, lastLogin: new Date().toISOString() }),
      token:   signAccess(tokenPayload),
      refreshToken: signRefresh(tokenPayload),
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user    = storage.getUserById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or inactive.' });
    }

    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    return res.json({
      success: true,
      token:   signAccess(tokenPayload),
      refreshToken: signRefresh(tokenPayload),
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Refresh token expired. Please log in again.' });
    }
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Requires: authenticate middleware
 */
function me(req, res) {
  const user = storage.getUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  return res.json({ success: true, user: safeUser(user) });
}

/**
 * POST /api/auth/logout
 * Client should discard tokens.  We just log the event.
 */
function logout(req, res) {
  storage.appendLog({
    severity:   'low',
    attackType: 'system',
    message:    `User "${req.user?.username || 'unknown'}" logged out`,
    source:     'AuthController',
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = { register, login, refresh, me, logout };
