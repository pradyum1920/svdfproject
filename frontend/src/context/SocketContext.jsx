/**
 * context/SocketContext.jsx
 * Provides a shared Socket.io connection and live event streams.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user }      = useAuth();
  const socketRef     = useRef(null);
  const [connected,   setConnected]   = useState(false);
  const [liveAlerts,  setLiveAlerts]  = useState([]);
  const [liveLogs,    setLiveLogs]    = useState([]);
  const [systemStatus, setSystemStatus] = useState('safe');
  const [metrics,     setMetrics]     = useState(null);

  useEffect(() => {
    if (!user) return;          // only connect when authenticated

    const token = localStorage.getItem('accessToken');
    const socket = io(SOCKET_URL, {
      auth:        { token },
      transports:  ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    /* ── Incoming events from backend ── */
    socket.on('alert:new', (alert) => {
      setLiveAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    socket.on('log:new', (log) => {
      setLiveLogs(prev => [log, ...prev].slice(0, 200));
    });

    socket.on('system:status', ({ status }) => {
      setSystemStatus(status);
    });

    socket.on('metrics:update', (m) => {
      setMetrics(m);
    });

    socket.on('simulation:started', ({ type }) => {
      appendLog({ level: 'system', message: `[SIM] Attack simulation started: ${type.toUpperCase()}` });
    });

    socket.on('simulation:stopped', () => {
      appendLog({ level: 'system', message: '[SIM] Simulation stopped by operator.' });
    });

    socket.on('simulation:event', (evt) => {
      appendLog({ level: evt.severity === 'high' ? 'error' : 'warn', message: evt.message });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const appendLog = useCallback((entry) => {
    setLiveLogs(prev => [
      {
        id:        Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...prev,
    ].slice(0, 200));
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const clearAlerts = useCallback(() => setLiveAlerts([]), []);

  return (
    <SocketContext.Provider value={{
      connected,
      liveAlerts,
      liveLogs,
      systemStatus,
      metrics,
      emit,
      appendLog,
      clearAlerts,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
}
