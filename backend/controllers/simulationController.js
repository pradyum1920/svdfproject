/**
 * controllers/simulationController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/simulation/start        — start a named simulation
 * POST /api/simulation/stop         — stop current simulation
 * GET  /api/simulation/status       — current simulation state
 * POST /api/simulation/detect       — quick one-shot detection scan
 * GET  /api/simulation/info/:type   — static knowledge base for attack type
 * POST /api/simulation/ai-scan      — AI anomaly scoring
 * ─────────────────────────────────────────────────────────────────────────────
 */

const simService = require('../services/simulationService');
const engine     = require('../services/detectionEngine');
const storage    = require('../services/storageService');

/** POST /api/simulation/start */
async function start(req, res, next) {
  try {
    const { type, payload, headers } = req.body;

    const validTypes = ['buffer_overflow', 'trapdoor', 'cache_poisoning'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error:   `Invalid simulation type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const result = await simService.startSimulation(type, { payload, headers: headers || {} });

    return res.status(200).json({
      success: true,
      message: `Simulation "${type}" started.`,
      data:    result,
    });
  } catch (err) {
    if (err.message.includes('already running')) {
      return res.status(409).json({ success: false, error: err.message });
    }
    next(err);
  }
}

/** POST /api/simulation/stop */
function stop(req, res, next) {
  try {
    const state = storage.getState();
    if (!state.simulationRunning) {
      return res.status(400).json({ success: false, error: 'No simulation is currently running.' });
    }
    const result = simService.stopSimulation();
    return res.json({ success: true, message: 'Simulation stopped.', data: result });
  } catch (err) { next(err); }
}

/** GET /api/simulation/status */
function status(req, res) {
  const state = storage.getState();
  return res.json({
    success: true,
    data: {
      simulationRunning: state.simulationRunning || false,
      activeAttack:      state.activeAttack      || null,
      systemStatus:      state.systemStatus      || 'safe',
      threatScore:       state.threatScore        || 0,
      startedAt:         state.startedAt          || null,
    },
  });
}

/**
 * POST /api/simulation/detect
 * Body: { payload, attackType?, headers? }
 * Quick one-shot scan — does NOT start the live metrics loop.
 */
function detect(req, res, next) {
  try {
    const { payload = '', attackType = 'generic', headers = {} } = req.body;

    const result = simService.quickScan(payload, headers, attackType);

    // Log the scan
    storage.appendLog({
      severity:   result.severity,
      attackType: result.attackType,
      message:    `Quick scan — detected: ${result.detected}`,
      source:     'QuickScan',
    });

    // Build an alert if something was found
    if (result.detected) {
      engine.buildAlert({
        attackType:  result.attackType,
        severity:    result.severity,
        title:       'Threat Detected via Quick Scan',
        message:     `Payload matched ${result.attackType} signatures`,
        details:     { score: result.score },
      });
    }

    return res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

/** GET /api/simulation/info/:type */
function info(req, res) {
  const { type } = req.params;
  const data = simService.getAttackInfo(type);
  if (!data) {
    return res.status(404).json({ success: false, error: `No info for attack type: ${type}` });
  }
  return res.json({ success: true, data });
}

/**
 * POST /api/simulation/ai-scan
 * Body: { payload?, cpu?, memory?, requestRate? }
 */
function aiScan(req, res, next) {
  try {
    const { payload = '', cpu = 0, memory = 0, requestRate = 0 } = req.body;

    const result = engine.aiAnomalyScore({ payload, cpu, memory, requestRate });

    // Log it
    storage.appendLog({
      severity:   result.severity,
      attackType: 'ai_scan',
      message:    `AI anomaly score: ${result.score} — ${result.label}`,
      source:     'AIEngine',
    });

    return res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

module.exports = { start, stop, status, detect, info, aiScan };
