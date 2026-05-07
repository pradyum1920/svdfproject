/**
 * utils/logger.js
 * Lightweight logger wrapper. Swap console.* for Winston/Pino in production.
 */

const config = require('../config/config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = config.isDev ? LEVELS.debug : LEVELS.info;

function _fmt(level, msg, meta) {
  const ts  = new Date().toISOString();
  const tag = `[${ts}] [${level.toUpperCase()}]`;
  return meta ? `${tag} ${msg} ${JSON.stringify(meta)}` : `${tag} ${msg}`;
}

const logger = {
  error: (msg, meta) => LEVELS.error <= currentLevel && console.error(_fmt('error', msg, meta)),
  warn:  (msg, meta) => LEVELS.warn  <= currentLevel && console.warn (_fmt('warn',  msg, meta)),
  info:  (msg, meta) => LEVELS.info  <= currentLevel && console.log  (_fmt('info',  msg, meta)),
  debug: (msg, meta) => LEVELS.debug <= currentLevel && console.log  (_fmt('debug', msg, meta)),
};

module.exports = logger;
