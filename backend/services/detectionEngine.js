/**
 * services/detectionEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core detection engine.  Analyses inputs, system metrics, and network patterns
 * to assign severity levels and generate structured alerts.
 *
 * Architecture:
 *   analyseInput()        → checks payload strings for injection patterns
 *   analyseSystemMetrics()→ CPU / memory anomaly detection
 *   detectBufferOverflow()→ simulated stack / heap overflow detection
 *   detectTrapdoor()      → backdoor access pattern recognition
 *   detectCachePoisoning()→ cache consistency anomaly detection
 *   aiAnomalyScore()      → dummy ML-style scoring (heuristic)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { v4: uuidv4 } = require('uuid');
const config          = require('../config/config');
const storage         = require('./storageService');

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };

const ATTACK_SIGNATURES = {
  BUFFER_OVERFLOW: [
    { pattern: /A{50,}/,               desc: 'Long repeated character sequence (stack smash probe)' },
    { pattern: /\x00{10,}/,            desc: 'Null-byte sled detected' },
    { pattern: /\\x[0-9a-fA-F]{2}(?:\\x[0-9a-fA-F]{2}){15,}/, desc: 'Shellcode hex sequence' },
    { pattern: /.{4096,}/,             desc: 'Oversized payload (> 4 KB)' },
    { pattern: /(%n|%s|%x|%p){3,}/i,   desc: 'Format string exploit pattern' },
  ],
  TRAPDOOR: [
    { pattern: /backdoor/i,            desc: 'Literal "backdoor" keyword in request' },
    { pattern: /cmd=|exec=|shell=/i,   desc: 'Command execution parameter detected' },
    { pattern: /\/etc\/passwd/,        desc: 'Linux credential file path traversal' },
    { pattern: /\b(nc|netcat|ncat)\b/i,desc: 'Netcat reverse shell indicator' },
    { pattern: /0\.0\.0\.0|127\.0\.0\.1:(?!80|443|3000|5000)\d{4,}/,
                                       desc: 'Unusual loopback port binding' },
    { pattern: /\/dev\/tcp\//,         desc: 'Bash TCP redirect (reverse shell technique)' },
  ],
  CACHE_POISONING: [
    { pattern: /X-Forwarded-Host:.+/i,  desc: 'Host header injection via X-Forwarded-Host' },
    { pattern: /X-Original-URL:.+/i,    desc: 'URL override header detected' },
    { pattern: /X-Rewrite-URL:.+/i,     desc: 'URL rewrite header abuse' },
    { pattern: /\r\n|\r|\n/,            desc: 'CRLF injection (response splitting)' },
    { pattern: /%0d%0a|%0D%0A/i,        desc: 'URL-encoded CRLF injection' },
    { pattern: /cache-control:.*(no-store|max-age=0).*/i,
                                        desc: 'Cache-control stripping attempt' },
  ],
  GENERIC: config.simulation.suspiciousPatterns.map((p, i) => ({
    pattern: p,
    desc: ['SQL Injection pattern', 'XSS payload', 'Path traversal', 'Code injection',
           'Hex shellcode probe', 'Credential stuffing'][i] || 'Suspicious pattern',
  })),
};

// ── Core Analyser ─────────────────────────────────────────────────────────────

/**
 * Analyse a free-form string input for attack signatures.
 * @param {string} input
 * @param {string} [context='generic']  - 'buffer_overflow'|'trapdoor'|'cache_poisoning'|'generic'
 * @returns {{ detected: boolean, matches: object[], severity: string, score: number }}
 */
function analyseInput(input, context = 'generic') {
  if (typeof input !== 'string') input = JSON.stringify(input);

  const sigKey = {
    buffer_overflow:  'BUFFER_OVERFLOW',
    trapdoor:         'TRAPDOOR',
    cache_poisoning:  'CACHE_POISONING',
    generic:          'GENERIC',
  }[context] || 'GENERIC';

  const sigs    = [...(ATTACK_SIGNATURES[sigKey] || []), ...ATTACK_SIGNATURES.GENERIC];
  const matches = [];

  for (const sig of sigs) {
    if (sig.pattern.test(input)) {
      matches.push({ pattern: sig.pattern.toString(), description: sig.desc });
    }
  }

  const score    = Math.min(100, matches.length * 25 + (input.length > 1000 ? 15 : 0));
  const severity = score >= 75 ? SEVERITY.HIGH
                 : score >= 40 ? SEVERITY.MEDIUM
                 : matches.length ? SEVERITY.LOW
                 : 'none';

  return { detected: matches.length > 0, matches, severity, score };
}

/**
 * Evaluate CPU and memory values for anomalies.
 * @param {{ cpu: number, memory: number }} metrics
 * @returns {{ anomaly: boolean, severity: string, reason: string[] }}
 */
function analyseSystemMetrics(metrics) {
  const reasons  = [];
  let   maxScore = 0;

  if (metrics.cpu >= config.simulation.cpuSpikeThreshold) {
    reasons.push(`CPU at ${metrics.cpu}% — exceeds ${config.simulation.cpuSpikeThreshold}% threshold`);
    maxScore = Math.max(maxScore, 80);
  } else if (metrics.cpu >= 65) {
    reasons.push(`CPU at ${metrics.cpu}% — elevated (warning zone)`);
    maxScore = Math.max(maxScore, 45);
  }

  if (metrics.memory >= config.simulation.memorySpikeThreshold) {
    reasons.push(`Memory at ${metrics.memory}% — exceeds ${config.simulation.memorySpikeThreshold}% threshold`);
    maxScore = Math.max(maxScore, 75);
  } else if (metrics.memory >= 60) {
    reasons.push(`Memory at ${metrics.memory}% — elevated (warning zone)`);
    maxScore = Math.max(maxScore, 40);
  }

  const severity = maxScore >= 75 ? SEVERITY.HIGH
                 : maxScore >= 40 ? SEVERITY.MEDIUM
                 : reasons.length  ? SEVERITY.LOW
                 : 'none';

  return { anomaly: reasons.length > 0, severity, reason: reasons, score: maxScore };
}

// ── Attack-Specific Detectors ─────────────────────────────────────────────────

/**
 * Simulate buffer overflow detection.
 * Returns step-by-step detection trace and a final verdict.
 */
function detectBufferOverflow(payload) {
  const steps  = [];
  let detected = false;
  let severity = SEVERITY.LOW;

  steps.push({ step: 1, msg: 'Inspecting payload size...', ts: _ts() });

  if (payload.length > 256) {
    steps.push({ step: 2, msg: `⚠ Payload length ${payload.length} exceeds safe buffer limit (256 bytes)`, ts: _ts() });
    detected = true;
    severity = payload.length > 1024 ? SEVERITY.HIGH : SEVERITY.MEDIUM;
  } else {
    steps.push({ step: 2, msg: `✓ Payload size ${payload.length} bytes — within bounds`, ts: _ts() });
  }

  steps.push({ step: 3, msg: 'Scanning for shellcode patterns...', ts: _ts() });
  const sigResult = analyseInput(payload, 'buffer_overflow');
  if (sigResult.detected) {
    steps.push({ step: 4, msg: `⚠ Shellcode / exploit pattern detected: ${sigResult.matches[0]?.description}`, ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 4, msg: '✓ No shellcode patterns found in payload', ts: _ts() });
  }

  steps.push({ step: 5, msg: 'Checking stack canary integrity...', ts: _ts() });
  const canaryCorrupt = payload.includes('\x00') || /[^\x20-\x7e]/.test(payload);
  if (canaryCorrupt) {
    steps.push({ step: 6, msg: '⚠ Stack canary corrupted — possible overflow in progress!', ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 6, msg: '✓ Stack canary intact', ts: _ts() });
  }

  steps.push({ step: 7, msg: detected ? '🔴 BUFFER OVERFLOW DETECTED — raising alert' : '🟢 No overflow detected', ts: _ts() });

  return {
    attackType: 'buffer_overflow',
    detected,
    severity: detected ? severity : 'none',
    steps,
    score: sigResult.score + (payload.length > 256 ? 30 : 0),
    recommendation: detected
      ? 'Apply bounds checking, use safe string functions (strncpy, strlcpy). Enable stack canaries and ASLR.'
      : 'System appears safe from buffer overflow at this payload.',
  };
}

/**
 * Simulate trapdoor / backdoor detection.
 */
function detectTrapdoor(payload, headers = {}) {
  const steps  = [];
  let detected = false;
  let severity = SEVERITY.LOW;

  steps.push({ step: 1, msg: 'Scanning request for backdoor indicators...', ts: _ts() });

  const sigResult = analyseInput(payload, 'trapdoor');
  if (sigResult.detected) {
    steps.push({ step: 2, msg: `⚠ Trapdoor keyword found: ${sigResult.matches.map(m => m.description).join('; ')}`, ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 2, msg: '✓ No backdoor keywords in payload', ts: _ts() });
  }

  steps.push({ step: 3, msg: 'Analysing request headers for covert channels...', ts: _ts() });
  const suspiciousHeaders = Object.entries(headers)
    .filter(([k]) => /x-(custom|secret|token|bypass|override)/i.test(k));
  if (suspiciousHeaders.length) {
    steps.push({ step: 4, msg: `⚠ Suspicious headers detected: ${suspiciousHeaders.map(([k]) => k).join(', ')}`, ts: _ts() });
    detected = true;
    severity = SEVERITY.MEDIUM;
  } else {
    steps.push({ step: 4, msg: '✓ Headers look clean', ts: _ts() });
  }

  steps.push({ step: 5, msg: 'Checking for privilege escalation patterns...', ts: _ts() });
  if (/sudo|su -|chmod 777|chown root|passwd/i.test(payload)) {
    steps.push({ step: 6, msg: '⚠ Privilege escalation commands detected!', ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 6, msg: '✓ No privilege escalation patterns', ts: _ts() });
  }

  steps.push({ step: 7, msg: detected ? '🔴 TRAPDOOR/BACKDOOR DETECTED — raising alert' : '🟢 No trapdoor activity detected', ts: _ts() });

  return {
    attackType: 'trapdoor',
    detected,
    severity: detected ? severity : 'none',
    steps,
    score: sigResult.score + (suspiciousHeaders.length * 15),
    recommendation: detected
      ? 'Audit all installed services. Remove unauthorised accounts. Review cron jobs and startup scripts.'
      : 'No backdoor indicators found. Continue regular audits.',
  };
}

/**
 * Simulate cache poisoning detection.
 */
function detectCachePoisoning(payload, headers = {}) {
  const steps  = [];
  let detected = false;
  let severity = SEVERITY.LOW;

  steps.push({ step: 1, msg: 'Examining cache-related headers...', ts: _ts() });

  // Check headers string-serialised for pattern matching
  const headerStr = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');
  const sigResult = analyseInput(headerStr + '\n' + payload, 'cache_poisoning');

  if (sigResult.detected) {
    steps.push({ step: 2, msg: `⚠ Cache injection pattern: ${sigResult.matches[0]?.description}`, ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 2, msg: '✓ No cache injection patterns detected', ts: _ts() });
  }

  steps.push({ step: 3, msg: 'Validating Host header integrity...', ts: _ts() });
  const hostHeader = headers['host'] || headers['Host'] || '';
  if (hostHeader && !/^[a-zA-Z0-9.\-:]+$/.test(hostHeader)) {
    steps.push({ step: 4, msg: `⚠ Malformed Host header: "${hostHeader}"`, ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 4, msg: '✓ Host header looks valid', ts: _ts() });
  }

  steps.push({ step: 5, msg: 'Checking for CRLF injection in response path...', ts: _ts() });
  if (/\r\n|\r|\n|%0d%0a/i.test(payload)) {
    steps.push({ step: 6, msg: '⚠ CRLF characters detected — potential response splitting!', ts: _ts() });
    detected = true;
    severity = SEVERITY.HIGH;
  } else {
    steps.push({ step: 6, msg: '✓ No CRLF injection found', ts: _ts() });
  }

  steps.push({ step: 7, msg: 'Verifying cache-key consistency...', ts: _ts() });
  // Simulate cache key mismatch (random 20% chance during detection)
  const cacheMismatch = Math.random() < 0.2;
  if (cacheMismatch) {
    steps.push({ step: 8, msg: '⚠ Cache key mismatch detected — cache may be poisoned!', ts: _ts() });
    detected = true;
    severity = SEVERITY.MEDIUM;
  } else {
    steps.push({ step: 8, msg: '✓ Cache keys consistent', ts: _ts() });
  }

  steps.push({ step: 9, msg: detected ? '🔴 CACHE POISONING DETECTED — raising alert' : '🟢 Cache integrity verified', ts: _ts() });

  return {
    attackType: 'cache_poisoning',
    detected,
    severity: detected ? severity : 'none',
    steps,
    score: sigResult.score,
    recommendation: detected
      ? 'Invalidate poisoned cache entries. Enforce strict Host header validation. Use Vary headers correctly.'
      : 'Cache appears healthy. Continue monitoring request headers.',
  };
}

// ── AI Anomaly Score (Heuristic "ML") ─────────────────────────────────────────

/**
 * Dummy AI scoring — mimics an ML model without any real ML library.
 * Combines multiple signals with weighted coefficients.
 * @param {{ payload: string, cpu: number, memory: number, requestRate: number }} features
 */
function aiAnomalyScore(features) {
  const { payload = '', cpu = 0, memory = 0, requestRate = 0 } = features;

  // Feature extraction
  const payloadLen     = Math.min(payload.length / 5000, 1);          // normalised 0-1
  const entropyScore   = _shannonEntropy(payload) / 8;                 // normalised 0-1
  const cpuScore       = cpu / 100;
  const memScore       = memory / 100;
  const rateScore      = Math.min(requestRate / 100, 1);
  const keywordHits    = config.simulation.suspiciousPatterns
                          .filter(p => p.test(payload)).length / 6;    // normalised

  // Weighted sum (coefficients tuned empirically)
  const raw = (
    payloadLen  * 0.10 +
    entropyScore* 0.20 +
    cpuScore    * 0.25 +
    memScore    * 0.20 +
    rateScore   * 0.10 +
    keywordHits * 0.15
  );

  const score    = Math.round(Math.min(raw * 100, 100));
  const anomaly  = score > 40;
  const severity = score >= 75 ? SEVERITY.HIGH
                 : score >= 40 ? SEVERITY.MEDIUM
                 : SEVERITY.LOW;
  const confidence = Math.min(95, 50 + score * 0.45);                 // 50-95%

  return {
    score,
    anomaly,
    severity,
    confidence: `${confidence.toFixed(1)}%`,
    features: { payloadLen: payloadLen.toFixed(3), entropyScore: entropyScore.toFixed(3),
                cpuScore, memScore, rateScore, keywordHits },
    label: anomaly ? '⚠ ANOMALY DETECTED by AI engine' : '✓ Normal behaviour pattern',
  };
}

// ── Alert Builder ─────────────────────────────────────────────────────────────

/**
 * Build and persist a structured alert, then return it.
 */
function buildAlert({ attackType, severity, title, message, details = {}, emitFn }) {
  const alert = storage.appendAlert({
    id:         uuidv4(),
    attackType,
    severity,
    title,
    message,
    details,
    timestamp:  new Date().toISOString(),
    acknowledged: false,
  });

  // Log it too
  storage.appendLog({
    attackType,
    severity,
    message: `[ALERT] ${title}: ${message}`,
    source: 'DetectionEngine',
  });

  // Update global alert counter
  const state = storage.getState();
  storage.updateState({ totalAlertsGenerated: (state.totalAlertsGenerated || 0) + 1 });

  // Optionally push via Socket.io
  if (typeof emitFn === 'function') emitFn('new_alert', alert);

  return alert;
}

// ── Private Helpers ───────────────────────────────────────────────────────────

function _ts() { return new Date().toISOString(); }

/**
 * Shannon entropy of a string — useful for detecting high-entropy shellcode.
 */
function _shannonEntropy(str) {
  if (!str) return 0;
  const freq = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((acc, f) => {
    const p = f / len;
    return acc + p * Math.log2(p);
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  SEVERITY,
  analyseInput,
  analyseSystemMetrics,
  detectBufferOverflow,
  detectTrapdoor,
  detectCachePoisoning,
  aiAnomalyScore,
  buildAlert,
};
