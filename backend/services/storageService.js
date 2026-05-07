/**
 * services/storageService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin abstraction over raw JSON-file reads and writes.
 * All I/O is synchronous so we never need to worry about concurrent corruption
 * in a single-process Node app.  (For production at scale → swap to SQLite.)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');
const config = require('../config/config');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a short name ('logs', 'alerts', 'users', 'system_state') to a full path.
 */
function filePath(name) {
  return path.join(config.dataDir, `${name}.json`);
}

/**
 * Read and parse a JSON data file.  Returns [] or {} when file is empty / missing.
 * @param {string} name  - file stem (without .json)
 * @param {'array'|'object'} defaultType
 */
function read(name, defaultType = 'array') {
  const fp = filePath(name);
  try {
    if (!fs.existsSync(fp)) return defaultType === 'array' ? [] : {};
    const raw = fs.readFileSync(fp, 'utf8').trim();
    if (!raw) return defaultType === 'array' ? [] : {};
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Storage] Error reading ${name}.json:`, err.message);
    return defaultType === 'array' ? [] : {};
  }
}

/**
 * Atomically write data to a JSON file.
 * @param {string} name - file stem
 * @param {*}      data - value to serialise
 */
function write(name, data) {
  const fp = filePath(name);
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[Storage] Error writing ${name}.json:`, err.message);
    return false;
  }
}

// ── Logs ─────────────────────────────────────────────────────────────────────

/**
 * Append a new log entry.  Trims oldest entries when limit is reached.
 * @param {object} entry
 * @returns {object} the stored entry
 */
function appendLog(entry) {
  const logs = read('logs');
  const enriched = {
    id:        entry.id        || require('uuid').v4(),
    timestamp: entry.timestamp || new Date().toISOString(),
    ...entry,
  };
  logs.unshift(enriched);                              // newest first
  if (logs.length > config.maxLogEntries) logs.length = config.maxLogEntries;
  write('logs', logs);
  return enriched;
}

/**
 * Return all logs, optionally filtered/paginated.
 * @param {{ severity?: string, attackType?: string, limit?: number, offset?: number }} opts
 */
function getLogs(opts = {}) {
  let logs = read('logs');
  if (opts.severity)   logs = logs.filter(l => l.severity === opts.severity);
  if (opts.attackType) logs = logs.filter(l => l.attackType === opts.attackType);
  const total  = logs.length;
  const offset = parseInt(opts.offset, 10) || 0;
  const limit  = parseInt(opts.limit,  10) || 50;
  return { total, data: logs.slice(offset, offset + limit) };
}

/** Wipe all logs. */
function clearLogs() {
  return write('logs', []);
}

// ── Alerts ────────────────────────────────────────────────────────────────────

/**
 * Append a new alert.  Purges alerts older than config.alertRetentionHours.
 */
function appendAlert(alert) {
  let alerts = read('alerts');
  const now  = Date.now();
  const cutoff = now - config.alertRetentionHours * 60 * 60 * 1000;

  // Purge stale
  alerts = alerts.filter(a => new Date(a.timestamp).getTime() > cutoff);

  const enriched = {
    id:        alert.id        || require('uuid').v4(),
    timestamp: alert.timestamp || new Date().toISOString(),
    acknowledged: false,
    ...alert,
  };
  alerts.unshift(enriched);
  write('alerts', alerts);
  return enriched;
}

function getAlerts(opts = {}) {
  let alerts = read('alerts');
  if (opts.severity) alerts = alerts.filter(a => a.severity === opts.severity);
  if (opts.unacknowledged) alerts = alerts.filter(a => !a.acknowledged);
  const total  = alerts.length;
  const offset = parseInt(opts.offset, 10) || 0;
  const limit  = parseInt(opts.limit,  10) || 50;
  return { total, data: alerts.slice(offset, offset + limit) };
}

function acknowledgeAlert(id) {
  const alerts = read('alerts');
  const idx = alerts.findIndex(a => a.id === id);
  if (idx === -1) return null;
  alerts[idx].acknowledged = true;
  alerts[idx].acknowledgedAt = new Date().toISOString();
  write('alerts', alerts);
  return alerts[idx];
}

function clearAlerts() {
  return write('alerts', []);
}

// ── System State ──────────────────────────────────────────────────────────────

function getState() {
  return read('system_state', 'object');
}

function updateState(partial) {
  const state = getState();
  const updated = { ...state, ...partial };
  write('system_state', updated);
  return updated;
}

function resetState() {
  const fresh = {
    simulationRunning:    false,
    activeAttack:         null,
    systemStatus:         'safe',
    threatScore:          0,
    cpu:                  12,
    memory:               34,
    startedAt:            null,
    stoppedAt:            null,
    totalAlertsGenerated: 0,
    totalSimulationsRun:  0,
  };
  write('system_state', fresh);
  return fresh;
}

// ── Users ─────────────────────────────────────────────────────────────────────

function getUsers() {
  return read('users');
}

function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

function getUserByUsername(username) {
  return getUsers().find(u => u.username === username) || null;
}

function getUserByEmail(email) {
  return getUsers().find(u => u.email === email) || null;
}

function saveUser(user) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) {
    users.push(user);
  } else {
    users[idx] = { ...users[idx], ...user };
  }
  write('users', users);
  return users.find(u => u.id === user.id);
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  // Logs
  appendLog, getLogs, clearLogs,
  // Alerts
  appendAlert, getAlerts, acknowledgeAlert, clearAlerts,
  // State
  getState, updateState, resetState,
  // Users
  getUsers, getUserById, getUserByUsername, getUserByEmail, saveUser,
  // Low-level
  read, write,
};
