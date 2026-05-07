/**
 * pages/AdminPanel.jsx
 * Admin-only control panel for system management.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI, simulationAPI } from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import CyberCard    from '../components/common/CyberCard.jsx';
import StatusBadge  from '../components/common/StatusBadge.jsx';

export default function AdminPanel() {
  const { connected, systemStatus } = useSocket();
  const [state,    setState]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [simType,  setSimType]  = useState('buffer_overflow');
  const [running,  setRunning]  = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [sRes, uRes, stRes] = await Promise.all([
        adminAPI.state(),
        adminAPI.users(),
        adminAPI.stats(),
      ]);
      setState(sRes.data.data  || sRes.data);
      setUsers(uRes.data.data  || uRes.data.users || []);
      setStats(stRes.data.data || stRes.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Simulation controls ── */
  async function startSim() {
    setRunning(true);
    try {
      await simulationAPI.start(simType);
      toast.success(`Simulation started: ${simType}`);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start simulation');
    } finally { setRunning(false); }
  }

  async function stopSim() {
    try {
      await simulationAPI.stop();
      toast.success('Simulation stopped');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to stop simulation');
    }
  }

  /* ── System reset ── */
  async function resetSystem() {
    if (!confirm('Reset system state? All active simulations will stop.')) return;
    try {
      await adminAPI.reset();
      toast.success('System state reset');
      await loadAll();
    } catch { toast.error('Reset failed'); }
  }

  /* ── User management ── */
  async function promoteUser(id) {
    try {
      await adminAPI.promote(id);
      toast.success('User promoted to admin');
      await loadAll();
    } catch { toast.error('Promotion failed'); }
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    try {
      await adminAPI.delete(id);
      setUsers(u => u.filter(x => x.id !== id));
      toast.success('User deleted');
    } catch { toast.error('Delete failed'); }
  }

  if (loading) return <LoadingScreen />;

  const simRunning = state?.simulationRunning || false;

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-lg text-amber-400 uppercase tracking-wider"
            style={{ textShadow: '0 0 10px rgba(245,158,11,0.4)' }}>
            ⚙ Admin Panel
          </h1>
          <p className="font-mono text-cyber-dim text-[10px] mt-0.5">
            SYSTEM CONTROL — RESTRICTED ACCESS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={systemStatus} pulse />
          <span className={`flex items-center gap-1.5 font-mono text-[10px] ${connected ? 'text-cyber-dim' : 'text-red-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-cyber-green' : 'bg-red-500'}`} />
            WS {connected ? 'LIVE' : 'OFF'}
          </span>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Users',    value: stats.totalUsers   ?? 0, color: '#00ff41' },
            { label: 'Total Logs',     value: stats.totalLogs    ?? 0, color: '#00b32b' },
            { label: 'Total Alerts',   value: stats.totalAlerts  ?? 0, color: '#f59e0b' },
            { label: 'Sim Runs',       value: stats.simRuns      ?? 0, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="cyber-panel p-3 text-center">
              <div className="font-display text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Simulation controls ── */}
        <CyberCard title="Simulation Control" icon="▶" subtitle="Start / Stop attack simulations">
          <div className="space-y-3">
            {/* Current status */}
            <div className="flex items-center justify-between p-3 bg-cyber-black rounded border border-cyber-border">
              <span className="font-mono text-xs text-cyber-dim">Simulation Status</span>
              <span className={`font-mono text-xs font-bold ${simRunning ? 'text-red-400' : 'text-cyber-green'}`}>
                {simRunning ? '⚡ RUNNING' : '● IDLE'}
              </span>
            </div>

            {/* Type selector */}
            <div>
              <label className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider block mb-1.5">
                Attack Type
              </label>
              <select
                value={simType}
                onChange={e => setSimType(e.target.value)}
                disabled={simRunning}
                className="w-full bg-cyber-black border border-cyber-border rounded px-3 py-2.5
                  font-mono text-xs text-cyber-green focus:outline-none focus:border-cyber-green/50
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="buffer_overflow">Buffer Overflow</option>
                <option value="trapdoor">Trapdoor / Backdoor</option>
                <option value="cache_poisoning">Cache Poisoning</option>
              </select>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startSim}
                disabled={simRunning || running}
                className="btn-neon py-2.5 text-[10px] border-green-500/50 text-green-400
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {running
                  ? <><span className="w-3 h-3 border border-current border-t-transparent rounded-full spin" /> Starting...</>
                  : '▶ Start'}
              </button>
              <button
                onClick={stopSim}
                disabled={!simRunning}
                className="btn-neon py-2.5 text-[10px] border-red-500/50 text-red-400
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ■ Stop
              </button>
            </div>

            <button
              onClick={resetSystem}
              className="w-full btn-neon py-2.5 text-[10px] border-amber-500/50 text-amber-400"
            >
              ↺ Reset System State
            </button>
          </div>
        </CyberCard>

        {/* ── System state ── */}
        <CyberCard title="System State" icon="⬡" subtitle="Current runtime configuration">
          {state ? (
            <div className="space-y-2">
              {[
                { k: 'System Status',    v: state.systemStatus    ?? 'safe',  hl: true },
                { k: 'Simulation',       v: state.simulationRunning ? 'RUNNING' : 'IDLE' },
                { k: 'Sim Type',         v: state.currentSimType  ?? '—' },
                { k: 'Threat Score',     v: `${state.threatScore  ?? 0}` },
                { k: 'CPU Usage',        v: `${(state.cpu ?? 0).toFixed(1)}%` },
                { k: 'Memory Usage',     v: `${(state.memory ?? 0).toFixed(1)}%` },
                { k: 'Last Cleared',     v: state.lastCleared ? new Date(state.lastCleared).toLocaleString() : '—' },
              ].map(row => (
                <div key={row.k} className="flex items-center justify-between py-1.5 border-b border-cyber-border/30">
                  <span className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider">{row.k}</span>
                  {row.hl
                    ? <StatusBadge status={row.v} />
                    : <span className="font-mono text-[10px] text-cyber-green">{row.v}</span>
                  }
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-cyber-dim text-xs text-center py-4">No state data</p>
          )}
        </CyberCard>
      </div>

      {/* ── User management ── */}
      <CyberCard title="User Management" icon="◈" subtitle={`${users.length} registered users`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                {['Username', 'Email', 'Role', 'Status', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-cyber-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <motion.tr
                  key={user.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-cyber-border/30 hover:bg-cyber-panel/30 transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono text-[10px] text-cyber-green">
                    {user.username}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[9px] text-cyber-dim">
                    {user.email || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                      user.role === 'admin'
                        ? 'text-amber-400 border-amber-500/40 bg-amber-900/20'
                        : 'text-cyber-dim border-cyber-border'
                    }`}>
                      {user.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={user.active !== false ? 'safe' : 'warning'}
                      label={user.active !== false ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[9px] text-cyber-dim whitespace-nowrap">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => promoteUser(user.id)}
                          className="font-mono text-[8px] px-2 py-1 border border-amber-500/40
                            text-amber-400 hover:bg-amber-900/20 rounded transition-colors"
                          title="Promote to admin"
                        >
                          ↑ PROMOTE
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="font-mono text-[8px] px-2 py-1 border border-red-500/40
                          text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        title="Delete user"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </CyberCard>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full spin mx-auto mb-3" />
        <p className="font-mono text-amber-400/60 text-xs">LOADING ADMIN PANEL...</p>
      </div>
    </div>
  );
}
