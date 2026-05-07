/**
 * services/socketService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Socket.io integration — sets up the server, registers event handlers,
 * and exposes a global emit helper so other services can push real-time events
 * to all connected clients without importing io directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Server } = require('socket.io');
const config     = require('../config/config');
const storage    = require('./storageService');

let _io = null;

/**
 * Initialise Socket.io on an existing HTTP server.
 * @param {http.Server} httpServer
 * @returns {Server} the Socket.io Server instance
 */
function init(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin:      config.clientUrl,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports:      ['websocket', 'polling'],
    pingTimeout:     30000,
    pingInterval:    25000,
  });

  _io.on('connection', (socket) => {
    console.log(`[Socket] Client connected  — id: ${socket.id}`);

    // ── Send initial system snapshot ──────────────────────────────────────────
    socket.emit('init_state', {
      state:  storage.getState(),
      alerts: storage.getAlerts({ limit: 10 }).data,
      logs:   storage.getLogs({ limit: 20 }).data,
    });

    // ── Client events ─────────────────────────────────────────────────────────

    socket.on('subscribe_metrics', () => {
      socket.join('metrics_room');
      socket.emit('subscribed', { room: 'metrics_room' });
    });

    socket.on('subscribe_alerts', () => {
      socket.join('alerts_room');
      socket.emit('subscribed', { room: 'alerts_room' });
    });

    socket.on('request_state', () => {
      socket.emit('init_state', {
        state:  storage.getState(),
        alerts: storage.getAlerts({ limit: 10 }).data,
        logs:   storage.getLogs({ limit: 20 }).data,
      });
    });

    socket.on('ping', () => socket.emit('pong', { ts: new Date().toISOString() }));

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected — id: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (err) => {
      console.error('[Socket] Error:', err.message);
    });
  });

  console.log('[Socket] Socket.io server initialised');
  return _io;
}

/**
 * Broadcast an event to ALL connected clients.
 * @param {string} event
 * @param {*}      data
 */
function emit(event, data) {
  if (!_io) return;
  _io.emit(event, { event, data, timestamp: new Date().toISOString() });
}

/**
 * Emit to a specific room only.
 */
function emitToRoom(room, event, data) {
  if (!_io) return;
  _io.to(room).emit(event, { event, data, timestamp: new Date().toISOString() });
}

/**
 * Returns connected client count.
 */
function connectedCount() {
  if (!_io) return 0;
  return _io.engine.clientsCount;
}

module.exports = { init, emit, emitToRoom, connectedCount };
