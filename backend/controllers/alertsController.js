/**
 * controllers/alertsController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/alerts               — list with optional filters
 * GET    /api/alerts/:id           — single alert
 * POST   /api/alerts/:id/ack       — acknowledge
 * POST   /api/alerts/ack-all       — acknowledge all
 * DELETE /api/alerts               — clear all (admin)
 * POST   /api/alerts/test          — emit a test alert (dev/admin)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { v4: uuidv4 } = require('uuid');
const storage    = require('../services/storageService');
const socketSvc  = require('../services/socketService');
const engine     = require('../services/detectionEngine');

/** GET /api/alerts */
function list(req, res) {
  const { severity, unacknowledged, limit, offset } = req.query;
  const result = storage.getAlerts({
    severity,
    unacknowledged: unacknowledged === 'true',
    limit:  parseInt(limit,  10) || 50,
    offset: parseInt(offset, 10) || 0,
  });
  return res.json({ success: true, ...result });
}

/** GET /api/alerts/:id */
function getOne(req, res) {
  const alerts = storage.getAlerts({ limit: 1000 }).data;
  const alert  = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ success: false, error: 'Alert not found.' });
  return res.json({ success: true, data: alert });
}

/** POST /api/alerts/:id/ack */
function acknowledge(req, res) {
  const updated = storage.acknowledgeAlert(req.params.id);
  if (!updated) return res.status(404).json({ success: false, error: 'Alert not found.' });
  socketSvc.emit('alert_acknowledged', { id: updated.id });
  return res.json({ success: true, message: 'Alert acknowledged.', data: updated });
}

/** POST /api/alerts/ack-all */
function acknowledgeAll(req, res) {
  const { data: alerts } = storage.getAlerts({ unacknowledged: true, limit: 1000 });
  alerts.forEach(a => storage.acknowledgeAlert(a.id));
  socketSvc.emit('all_alerts_acknowledged', { count: alerts.length });
  return res.json({ success: true, message: `${alerts.length} alert(s) acknowledged.` });
}

/** DELETE /api/alerts — admin only */
function clearAll(req, res) {
  storage.clearAlerts();
  socketSvc.emit('alerts_cleared', {});
  return res.json({ success: true, message: 'All alerts cleared.' });
}

/**
 * POST /api/alerts/test
 * Generates a synthetic alert for testing the UI notification pipeline.
 */
function testAlert(req, res) {
  const severities = ['low', 'medium', 'high'];
  const types      = ['buffer_overflow', 'trapdoor', 'cache_poisoning', 'generic'];
  const severity   = req.body.severity || severities[Math.floor(Math.random() * 3)];
  const attackType = req.body.attackType || types[Math.floor(Math.random() * 4)];

  const alert = engine.buildAlert({
    attackType,
    severity,
    title:   `Test Alert [${severity.toUpperCase()}]`,
    message: `This is a synthetic test alert generated at ${new Date().toISOString()}`,
    details: { source: 'ManualTest', triggeredBy: req.user?.username || 'system' },
    emitFn:  socketSvc.emit.bind(socketSvc),
  });

  return res.status(201).json({ success: true, message: 'Test alert created.', data: alert });
}

module.exports = { list, getOne, acknowledge, acknowledgeAll, clearAll, testAlert };
