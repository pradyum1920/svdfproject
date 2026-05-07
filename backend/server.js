/**
 * server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point for the SVDF (Security Vulnerability Detection Framework) backend.
 *
 * Responsibilities:
 *   1. Bootstrap Express with security headers, CORS, body parsers
 *   2. Mount all REST API route groups
 *   3. Attach Socket.io to the HTTP server
 *   4. Wire the simulationService emitter to the socket layer
 *   5. Register global error handlers
 *   6. Start listening
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Environment ───────────────────────────────────────────────────────────────
require('dotenv').config();

// ── Core imports ──────────────────────────────────────────────────────────────
const http       = require('http');
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

// ── Internal imports ──────────────────────────────────────────────────────────
const config     = require('./config/config');
const socketSvc  = require('./services/socketService');
const simService = require('./services/simulationService');
const storage    = require('./services/storageService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ── Route handlers ────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const dashboardRoutes  = require('./routes/dashboard');
const simulationRoutes = require('./routes/simulation');
const alertsRoutes     = require('./routes/alerts');
const logsRoutes       = require('./routes/logs');
const adminRoutes      = require('./routes/admin');

// ─────────────────────────────────────────────────────────────────────────────
// Create Express app and wrap in a plain HTTP server so Socket.io can share it
// ─────────────────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // Frontend handles its own CSP
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      config.clientUrl,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── HTTP request logger ───────────────────────────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:        config.rateLimit.windowMs,
  max:             config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

// ── Auth rate limiter (stricter) ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      20,
  message:  { success: false, error: 'Too many authentication attempts.' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Health check (unauthenticated) ────────────────────────────────────────────
app.get('/health', (req, res) => {
  const state = storage.getState();
  res.json({
    status:    'ok',
    service:   'SVDF Backend',
    version:   '1.0.0',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    system:    {
      simulationRunning: state.simulationRunning || false,
      systemStatus:      state.systemStatus      || 'safe',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/alerts',     alertsRoutes);
app.use('/api/logs',       logsRoutes);
app.use('/api/admin',      adminRoutes);

// ── API index ─────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name:    'SVDF API',
    version: '1.0.0',
    routes: [
      'POST   /api/auth/register',
      'POST   /api/auth/login',
      'POST   /api/auth/refresh',
      'GET    /api/auth/me',
      'POST   /api/auth/logout',
      'GET    /api/dashboard/overview',
      'GET    /api/dashboard/metrics',
      'GET    /api/dashboard/trend',
      'GET    /api/dashboard/status',
      'POST   /api/simulation/start',
      'POST   /api/simulation/stop',
      'GET    /api/simulation/status',
      'POST   /api/simulation/detect',
      'GET    /api/simulation/info/:type',
      'POST   /api/simulation/ai-scan',
      'GET    /api/alerts',
      'POST   /api/alerts/test',
      'POST   /api/alerts/ack-all',
      'POST   /api/alerts/:id/ack',
      'DELETE /api/alerts',
      'GET    /api/logs',
      'GET    /api/logs/download',
      'POST   /api/logs',
      'DELETE /api/logs',
      'GET    /api/admin/state',
      'POST   /api/admin/reset',
      'GET    /api/admin/users',
      'PATCH  /api/admin/users/:id',
      'DELETE /api/admin/users/:id',
      'POST   /api/admin/users/:id/promote',
      'GET    /api/admin/stats',
    ],
  });
});

// ── 404 + Error handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────────
socketSvc.init(server);

// Wire simulation events into Socket.io broadcasts
simService.setEmitter(socketSvc.emit.bind(socketSvc));

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(config.port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      SVDF — Security Vulnerability Detection Framework   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  API   →  http://localhost:${config.port}/api                   ║`);
  console.log(`║  WS    →  ws://localhost:${config.port}                         ║`);
  console.log(`║  Env   →  ${config.nodeEnv.padEnd(48)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Default credentials:');
  console.log('    admin   / password123  (role: admin)');
  console.log('    analyst / password123  (role: user)');
  console.log('');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[Server] Received ${signal} — shutting down gracefully...`);
  const state = storage.getState();
  if (state.simulationRunning) simService.stopSimulation();
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  err => { console.error('[Uncaught]',  err); process.exit(1); });
process.on('unhandledRejection', err => { console.error('[Unhandled]', err); process.exit(1); });

module.exports = { app, server };
