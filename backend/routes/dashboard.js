/**
 * routes/dashboard.js
 * GET /api/dashboard/overview
 * GET /api/dashboard/metrics
 * GET /api/dashboard/trend
 * GET /api/dashboard/status
 */

const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);   // All dashboard routes require login

router.get('/overview', ctrl.overview);
router.get('/metrics',  ctrl.metrics);
router.get('/trend',    ctrl.trend);
router.get('/status',   ctrl.status);

module.exports = router;
