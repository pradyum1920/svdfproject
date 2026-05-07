/**
 * config/config.js
 * Central configuration module — reads from .env with safe defaults.
 */

require('dotenv').config();

const config = {
  // ── Server ────────────────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // ── JWT ───────────────────────────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET || 'svdf_default_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'svdf_refresh_default_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // ── CORS ──────────────────────────────────────────────────
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // ── Rate Limiting ─────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // ── Data & Storage ────────────────────────────────────────
  dataDir: require('path').join(__dirname, '..', 'data'),
  maxLogEntries: parseInt(process.env.MAX_LOG_ENTRIES, 10) || 1000,
  alertRetentionHours: parseInt(process.env.ALERT_RETENTION_HOURS, 10) || 24,

  // ── Simulation Thresholds ─────────────────────────────────
  simulation: {
    cpuSpikeThreshold: 85,      // % - triggers High alert
    memorySpikeThreshold: 80,   // %
    threatScoreHigh: 75,
    threatScoreMedium: 40,
    suspiciousPatterns: [
      /(\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUNION\b)/i,   // SQL injection
      /<script[\s\S]*?>/i,                                           // XSS
      /\.\.\//,                                                      // Path traversal
      /(\beval\b|\bexec\b|\bsystem\b|\bpassthru\b)/i,               // Code injection
      /(0x[0-9a-fA-F]{8,})/,                                        // Hex shellcode pattern
      /(\bADMIN\b|\bROOT\b|\bPASSWORD\b).*=.*/i,                   // Credential stuffing
    ],
  },
};

module.exports = config;
