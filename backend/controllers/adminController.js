/**
 * controllers/adminController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only endpoints (all protected by authenticate + authorise('admin')):
 *
 * GET    /api/admin/state          — full system state
 * POST   /api/admin/reset          — reset system to clean slate
 * GET    /api/admin/users          — list users
 * PATCH  /api/admin/users/:id      — update user (role / isActive)
 * DELETE /api/admin/users/:id      — delete user
 * POST   /api/admin/users/:id/promote — promote to admin
 * GET    /api/admin/stats          — aggregate statistics
 * ─────────────────────────────────────────────────────────────────────────────
 */

const storage    = require('../services/storageService');
const simService = require('../services/simulationService');
const socketSvc  = require('../services/socketService');

/** GET /api/admin/state */
function getState(req, res) {
  const state       = storage.getState();
  const { total: logCount }   = storage.getLogs({ limit: 1 });
  const { total: alertCount } = storage.getAlerts({ limit: 1 });

  return res.json({
    success: true,
    data: {
      ...state,
      logCount,
      alertCount,
      connectedClients: socketSvc.connectedCount(),
      serverUptime:     process.uptime(),
      nodeVersion:      process.version,
      memoryUsage:      process.memoryUsage(),
    },
  });
}

/**
 * POST /api/admin/reset
 * Stops any simulation, clears logs/alerts, resets state.
 */
function reset(req, res) {
  const state = storage.getState();
  if (state.simulationRunning) simService.stopSimulation();

  const { clearLogs = false, clearAlerts = false } = req.body;
  if (clearLogs)   storage.clearLogs();
  if (clearAlerts) storage.clearAlerts();

  const fresh = storage.resetState();
  socketSvc.emit('system_reset', { by: req.user.username, timestamp: new Date().toISOString() });

  storage.appendLog({
    severity: 'low', attackType: 'system',
    message: `System reset by admin "${req.user.username}" — clearLogs:${clearLogs}, clearAlerts:${clearAlerts}`,
    source: 'AdminPanel',
  });

  return res.json({ success: true, message: 'System reset successfully.', data: fresh });
}

/** GET /api/admin/users */
function listUsers(req, res) {
  const users = storage.getUsers().map(u => {
    const { password, ...safe } = u;  // eslint-disable-line no-unused-vars
    return safe;
  });
  return res.json({ success: true, data: users, total: users.length });
}

/**
 * PATCH /api/admin/users/:id
 * Body: { role?, isActive? }
 */
function updateUser(req, res) {
  const { id } = req.params;
  const user   = storage.getUserById(id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

  // Prevent self-demotion
  if (id === req.user.id && req.body.role && req.body.role !== 'admin') {
    return res.status(400).json({ success: false, error: 'You cannot change your own role.' });
  }

  const allowed = {};
  if (req.body.role     !== undefined) allowed.role     = req.body.role;
  if (req.body.isActive !== undefined) allowed.isActive = req.body.isActive;

  const updated = storage.saveUser({ ...user, ...allowed });
  const { password, ...safe } = updated;   // eslint-disable-line no-unused-vars
  return res.json({ success: true, message: 'User updated.', data: safe });
}

/** DELETE /api/admin/users/:id */
function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own account.' });
  }
  const user = storage.getUserById(id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

  // Mark inactive instead of hard-delete (preserve audit trail)
  storage.saveUser({ ...user, isActive: false });
  return res.json({ success: true, message: `User "${user.username}" deactivated.` });
}

/** POST /api/admin/users/:id/promote */
function promoteUser(req, res) {
  const user = storage.getUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  const updated = storage.saveUser({ ...user, role: 'admin' });
  const { password, ...safe } = updated;   // eslint-disable-line no-unused-vars
  return res.json({ success: true, message: `User "${user.username}" promoted to admin.`, data: safe });
}

/** GET /api/admin/stats */
function stats(req, res) {
  const allLogs   = storage.getLogs({ limit: 1000 }).data;
  const allAlerts = storage.getAlerts({ limit: 1000 }).data;
  const users     = storage.getUsers();
  const state     = storage.getState();

  // Attack type distribution
  const byType = allLogs.reduce((acc, l) => {
    if (l.attackType) acc[l.attackType] = (acc[l.attackType] || 0) + 1;
    return acc;
  }, {});

  // Severity distribution
  const bySeverity = allLogs.reduce((acc, l) => {
    if (l.severity) acc[l.severity] = (acc[l.severity] || 0) + 1;
    return acc;
  }, {});

  // Hourly activity (last 24 h)
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const now   = Date.now();
    const end   = now - i * 3600000;
    const start = end - 3600000;
    return {
      hour:  new Date(start).getUTCHours(),
      count: allLogs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= start && t < end;
      }).length,
    };
  }).reverse();

  return res.json({
    success: true,
    data: {
      totalLogs:          allLogs.length,
      totalAlerts:        allAlerts.length,
      unacknowledged:     allAlerts.filter(a => !a.acknowledged).length,
      totalUsers:         users.length,
      activeUsers:        users.filter(u => u.isActive).length,
      totalSimulations:   state.totalSimulationsRun || 0,
      totalAlertsGenerated: state.totalAlertsGenerated || 0,
      byType,
      bySeverity,
      hourlyActivity: hourly,
    },
  });
}

module.exports = { getState, reset, listUsers, updateUser, deleteUser, promoteUser, stats };
