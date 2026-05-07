/**
 * routes/simulation.js
 * POST /api/simulation/start
 * POST /api/simulation/stop
 * GET  /api/simulation/status
 * POST /api/simulation/detect
 * GET  /api/simulation/info/:type
 * POST /api/simulation/ai-scan
 */

const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl   = require('../controllers/simulationController');
const { authenticate, authorise } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate);

// Start (admin or user)
router.post('/start',
  [body('type').notEmpty().withMessage('type is required')],
  validate,
  ctrl.start,
);

// Stop (admin only)
router.post('/stop', authorise('admin'), ctrl.stop);

// Status — any authenticated user
router.get('/status', ctrl.status);

// Quick detection scan
router.post('/detect',
  [body('payload').notEmpty().withMessage('payload is required')],
  validate,
  ctrl.detect,
);

// Attack knowledge base
router.get('/info/:type',
  param('type').isIn(['buffer_overflow', 'trapdoor', 'cache_poisoning'])
    .withMessage('Invalid attack type'),
  validate,
  ctrl.info,
);

// AI anomaly scoring
router.post('/ai-scan', ctrl.aiScan);

module.exports = router;
