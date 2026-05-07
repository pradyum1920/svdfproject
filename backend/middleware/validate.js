/**
 * middleware/validate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around express-validator that turns validation errors into a
 * consistent 422 JSON response.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { validationResult } = require('express-validator');

/**
 * validate — Run after express-validator chains.
 * Responds 422 if any errors exist; otherwise calls next().
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error:   'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { validate };
