/**
 * controllers/dashboardController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/dashboard/overview   — combined snapshot for dashboard widgets
 * GET /api/dashboard/metrics    — raw CPU / memory / threat score
 * GET /api/dashboard/trend      — attack trend data (last N periods)
 * GET /api/dashboard/status     — system status string
 * ─────────────────────────────────────────────────────────────────────────────
 */

const storage = require('../services/storageService');
const engine  = require('../services/detectionEngine');

/**
 * GET /api/dashboard/overview
 * Returns everything the main dashboard needs in a single request.
 */
function overview(req, res) {
  const state       = storage.getState();
  const recentLogs  = storage.getLogs({ limit: 15 }).data;
  const recentAlerts= storage.getAlerts({ limit: 10 }).data;
  const allLogs     = storage.getLogs({ limit: 1000 }).data;

  // Count alerts by severity
  const alertCounts = allLogs.reduce((acc, l) => {
    if (l.severity) acc[l.severity] = (acc[l.severity] || 0) + 1;
    return acc;
  }, { low: 0, medium: 0, high: 0 });

  // Unacknowledged alerts
  const unackedAlerts = recentAlerts.filter(a => !a.acknowledged).length;

  return res.json({
    success: true,
    data: {
      system: {
        status:       state.systemStatus  || 'safe',
        threatScore:  state.threatScore   || 0,
        cpu:          state.cpu           || 0,
        memory:       state.memory        || 0,
        simulationRunning: state.simulationRunning || false,
        activeAttack:      state.activeAttack      || null,
        startedAt:         state.startedAt         || null,
      },
      stats: {
        totalAlerts:        state.totalAlertsGenerated || 0,
        totalSimulations:   state.totalSimulationsRun  || 0,
        unacknowledgedAlerts: unackedAlerts,
        alertCounts,
      },
      recentLogs,
      recentAlerts,
      connectedClients: 0, // populated by socketService if needed
    },
  });
}

/**
 * GET /api/dashboard/metrics
 * Lightweight endpoint polled periodically (fallback if Socket.io unavailable).
 */
function metrics(req, res) {
  const state = storage.getState();

  // Simulate slight jitter when simulation is running
  let cpu    = state.cpu    || 0;
  let memory = state.memory || 0;

  if (state.simulationRunning) {
    cpu    = Math.min(98, cpu    + (Math.random() * 4 - 2));
    memory = Math.min(96, memory + (Math.random() * 4 - 2));
  }

  const analysis = engine.analyseSystemMetrics({ cpu, memory });

  return res.json({
    success: true,
    data: {
      cpu:          Math.round(cpu),
      memory:       Math.round(memory),
      threatScore:  state.threatScore || 0,
      systemStatus: state.systemStatus || 'safe',
      anomaly:      analysis.anomaly,
      timestamp:    new Date().toISOString(),
    },
  });
}

/**
 * GET /api/dashboard/trend?periods=12
 * Returns bucketed attack counts for a chart (last N 5-minute periods).
 */
function trend(req, res) {
  const periods = Math.min(parseInt(req.query.periods, 10) || 12, 48);
  const logs    = storage.getLogs({ limit: 1000 }).data;
  const now     = Date.now();
  const bucketMs = 5 * 60 * 1000; // 5 minutes

  const buckets = Array.from({ length: periods }, (_, i) => {
    const end   = now - i * bucketMs;
    const start = end - bucketMs;
    const count = logs.filter(l => {
      const t = new Date(l.timestamp).getTime();
      return t >= start && t < end;
    });
    return {
      period:    new Date(start).toISOString(),
      label:     _timeLabel(new Date(start)),
      total:     count.length,
      high:      count.filter(l => l.severity === 'high').length,
      medium:    count.filter(l => l.severity === 'medium').length,
      low:       count.filter(l => l.severity === 'low').length,
    };
  }).reverse();

  return res.json({ success: true, data: buckets });
}

/**
 * GET /api/dashboard/status
 */
function status(req, res) {
  const state = storage.getState();
  return res.json({
    success: true,
    data: {
      status:            state.systemStatus || 'safe',
      simulationRunning: state.simulationRunning || false,
      activeAttack:      state.activeAttack || null,
      threatScore:       state.threatScore  || 0,
      uptime:            process.uptime(),
      timestamp:         new Date().toISOString(),
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _timeLabel(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

module.exports = { overview, metrics, trend, status };
