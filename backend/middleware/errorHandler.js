/**
 * middleware/errorHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Express error handler.  Must be registered LAST (after all routes).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const config = require('../config/config');

/**
 * notFound — 404 fallthrough handler.
 */
function notFound(req, res, next) {
  const err  = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

/**
 * errorHandler — catches all errors, responds with structured JSON.
 */
function errorHandler(err, req, res, next) {   // eslint-disable-line no-unused-vars
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log to console (in production pipe to a proper logger like Winston)
  if (status >= 500) {
    console.error('[Error]', {
      status,
      message,
      stack: config.isDev ? err.stack : undefined,
      path:  req.originalUrl,
    });
  }

  res.status(status).json({
    success: false,
    error:   message,
    ...(config.isDev && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
