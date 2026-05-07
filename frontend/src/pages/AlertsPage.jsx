/**
 * pages/AlertsPage.jsx
 * Real-time alert management with Socket.io integration.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { alertsAPI } from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import StatusBadge  from '../components/common/StatusBadge.jsx';
import CyberCard    from '../components/common/CyberCard.jsx';

export default function AlertsPage() {
  const { liveAlerts, clearAlerts } = useSocket();
  const [apiAlerts, setApiAlerts]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [filter,    setFilter]      = useState('all');   // all | low | medium | high

  async function load() {
    try {
      const { data } = await alertsAPI.list({ limit: 100 });
      setApiAlerts(data.data || data.alerts || []);
    } catch (_) { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [liveAlerts.length]);

  async function ackAll() {
    try {
      await alertsAPI.ackAll();
      await load();
      clearAlerts();
      toast.success('All alerts acknowledged');
    } catch { toast.error('Failed to acknowledge alerts'); }
  }

  async function clearAll() {
    try {
      await alertsAPI.clear();
      setApiAlerts([]);
      clearAlerts();
      toast.success('Alerts cleared');
    } catch { toast.error('Failed to clear alerts'); }
  }

  async function ackOne(id) {
    try {
      await alertsAPI.ack(id);
      setApiAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } catch { toast.error('Failed to acknowledge'); }
  }

  async function sendTest() {
    try {
      await alertsAPI.test();
      toast.success('Test alert sent');
      setTimeout(load, 800);
    } catch { toast.error('Failed to send test alert'); }
  }

  /* ── Merge + de-duplicate live + API alerts ── */
  const merged = [
    ...liveAlerts,
    ...apiAlerts.filter(a => !liveAlerts.find(l => l.id === a.id)),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const shown = filter === 'all' ? merged : merged.filter(a => a.severity === filter);

  const counts = {
    high:   merged.filter(a => a.severity === 'high').length,
    medium: merged.filter(a => a.severity === 'medium').length,
    low:    merged.filter(a => a.severity === 'low').length,
  };

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-lg text-cyber-green uppercase tracking-wider glow-text-sm">
            Alerts & Notifications
          </h1>
          <p className="font-mono text-cyber-dim text-[10px] mt-0.5">
            REAL-TIME THREAT ALERT CENTER — {merged.length} TOTAL
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={sendTest}
            className="btn-neon text-[10px] px-4 py-1.5 border-blue-500/50 text-blue-400">
            ⚡ Test Alert
          </button>
          <button onClick={ackAll}
            className="btn-neon text-[10px] px-4 py-1.5 border-amber-500/50 text-amber-400">
            ✓ Ack All
          </button>
          <button onClick={clearAll}
            className="btn-neon text-[10px] px-4 py-1.5 border-red-500/50 text-red-400">
            ✕ Clear All
          </button>
        </div>
      </motion.div>

      {/* ── Severity summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { sev: 'high',   label: 'Critical',  count: counts.high,   color: '#ef4444', bg: 'bg-red-900/20',    border: 'border-red-500/30' },
          { sev: 'medium', label: 'Elevated',  count: counts.medium, color: '#f59e0b', bg: 'bg-amber-900/20',  border: 'border-amber-500/30' },
          { sev: 'low',    label: 'Advisory',  count: counts.low,    color: '#22c55e', bg: 'bg-green-900/20',  border: 'border-green-500/30' },
        ].map((c) => (
          <motion.button
            key={c.sev}
            onClick={() => setFilter(filter === c.sev ? 'all' : c.sev)}
            className={`cyber-panel p-4 text-center border transition-all ${c.bg} ${c.border}
              ${filter === c.sev ? 'shadow-md' : 'opacity-70 hover:opacity-100'}`}
            style={filter === c.sev ? { boxShadow: `0 0 20px ${c.color}25` } : {}}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <div className="font-display text-3xl font-black" style={{ color: c.color }}>
              {c.count}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider mt-1"
              style={{ color: c.color, opacity: 0.8 }}>
              {c.label}
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Severity filter tabs ── */}
      <div className="flex gap-1 border-b border-cyber-border pb-0">
        {['all', 'high', 'medium', 'low'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-all border-b-2 -mb-px
              ${filter === f
                ? 'border-cyber-green text-cyber-green'
                : 'border-transparent text-cyber-dim hover:text-cyber-green'}`}
          >
            {f} {f !== 'all' && `(${counts[f] ?? 0})`}
          </button>
        ))}
      </div>

      {/* ── Alert list ── */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border border-cyber-green border-t-transparent rounded-full spin mx-auto" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 cyber-panel">
          <p className="font-display text-4xl text-cyber-green/20 mb-3">✓</p>
          <p className="font-mono text-cyber-dim text-sm">No alerts in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {shown.map((alert, i) => (
              <AlertCard key={alert.id || i} alert={alert} onAck={() => ackOne(alert.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onAck }) {
  const sevConfig = {
    high:   { border: 'border-red-500/40',   bg: 'bg-red-900/10',   text: 'text-red-400',   icon: '🚨' },
    medium: { border: 'border-amber-500/40', bg: 'bg-amber-900/10', text: 'text-amber-400', icon: '⚠️' },
    low:    { border: 'border-green-600/40', bg: 'bg-green-900/10', text: 'text-green-400', icon: 'ℹ️' },
  };
  const cfg = sevConfig[alert.severity] || sevConfig.low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-start gap-4 p-3 rounded border ${cfg.border} ${cfg.bg}
        ${alert.acknowledged ? 'opacity-50' : ''} log-row`}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <StatusBadge status={alert.severity} />
          {alert.type && (
            <span className="attack-badge bg-cyber-panel border border-cyber-border text-cyber-dim">
              {alert.type?.replace(/_/g, ' ')}
            </span>
          )}
          {alert.acknowledged && (
            <span className="font-mono text-[9px] text-cyber-dim border border-cyber-border px-1.5 py-0.5 rounded">
              ACK
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-cyber-green leading-relaxed break-words">{alert.message}</p>
        <p className="font-mono text-[9px] text-cyber-dim/60 mt-1">
          {new Date(alert.timestamp).toLocaleString()}
        </p>
      </div>

      {!alert.acknowledged && (
        <button
          onClick={onAck}
          className="flex-shrink-0 font-mono text-[9px] text-cyber-dim border border-cyber-border
            px-2 py-1 rounded hover:border-cyber-green hover:text-cyber-green transition-colors"
        >
          ACK
        </button>
      )}
    </motion.div>
  );
}
