/**
 * pages/Dashboard.jsx
 * Main monitoring dashboard with real-time metrics, charts, and live logs.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';

import { dashboardAPI } from '../services/api.js';
import { useSocket }    from '../context/SocketContext.jsx';
import TerminalLog      from '../components/common/TerminalLog.jsx';
import CyberCard        from '../components/common/CyberCard.jsx';
import StatusBadge      from '../components/common/StatusBadge.jsx';

/* ── Custom tooltip ── */
const CyberTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cyber-dark border border-cyber-border p-2 rounded">
      <p className="font-mono text-[9px] text-cyber-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono text-[10px]" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { liveAlerts, liveLogs, systemStatus, metrics: socketMetrics } = useSocket();

  const [overview,   setOverview]   = useState(null);
  const [metrics,    setMetrics]    = useState(null);
  const [trend,      setTrend]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  /* ── Fetch dashboard data ── */
  const fetchData = useCallback(async () => {
    try {
      const [ov, met, tr] = await Promise.all([
        dashboardAPI.overview(),
        dashboardAPI.metrics(),
        dashboardAPI.trend(),
      ]);
      setOverview(ov.data.data || ov.data);
      setMetrics(met.data.data  || met.data);
      setTrend((tr.data.data    || tr.data)?.trend || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, [fetchData]);

  /* ── Merge socket metrics ── */
  const cpu    = socketMetrics?.cpu    ?? metrics?.cpu    ?? 0;
  const memory = socketMetrics?.memory ?? metrics?.memory ?? 0;
  const threat = socketMetrics?.threatScore ?? metrics?.threatScore ?? 0;

  if (loading) return <Skeleton />;

  const attackTypes = [
    { name: 'Buffer Overflow', count: overview?.attackCounts?.buffer_overflow ?? 0, color: '#ef4444' },
    { name: 'Trapdoor',        count: overview?.attackCounts?.trapdoor         ?? 0, color: '#f59e0b' },
    { name: 'Cache Poisoning', count: overview?.attackCounts?.cache_poisoning  ?? 0, color: '#8b5cf6' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg text-cyber-green uppercase tracking-wider glow-text-sm">
            System Dashboard
          </h1>
          <p className="font-mono text-cyber-dim text-[10px] mt-0.5">
            REAL-TIME THREAT MONITORING — AUTO REFRESH: 5s
          </p>
        </div>
        <StatusBadge status={systemStatus} pulse />
      </motion.div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="CPU Usage"       value={`${cpu.toFixed(1)}%`}     icon="⬡" bar={cpu}    barColor={cpu > 85 ? '#ef4444' : '#00ff41'} />
        <KpiCard title="Memory"          value={`${memory.toFixed(1)}%`}  icon="◉" bar={memory} barColor={memory > 80 ? '#ef4444' : '#00b32b'} />
        <KpiCard title="Threat Score"    value={threat.toFixed(0)}         icon="⚠" bar={threat} barColor={threat > 75 ? '#ef4444' : threat > 40 ? '#f59e0b' : '#00ff41'} />
        <KpiCard title="Active Alerts"   value={liveAlerts.length}         icon="◈" bar={Math.min(liveAlerts.length * 5, 100)} barColor="#f59e0b" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Attack trend */}
        <CyberCard title="Attack Trend (24h)" icon="📈" subtitle="Hourly attack events">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff41" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.07)" />
              <XAxis dataKey="hour" tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'Share Tech Mono' }} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'Share Tech Mono' }} />
              <Tooltip content={<CyberTooltip />} />
              <Area type="monotone" dataKey="attacks" stroke="#00ff41" strokeWidth={2}
                fill="url(#areaGrad)" name="Attacks" />
            </AreaChart>
          </ResponsiveContainer>
        </CyberCard>

        {/* Attack type breakdown */}
        <CyberCard title="Attack Types" icon="◈" subtitle="By vector">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={attackTypes} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.07)" />
              <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 8, fontFamily: 'Share Tech Mono' }} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'Share Tech Mono' }} />
              <Tooltip content={<CyberTooltip />} />
              {attackTypes.map((a) => (
                <Bar key={a.name} dataKey="count" fill={a.color} name="Events"
                  radius={[2,2,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CyberCard>
      </div>

      {/* ── Alerts + Terminal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Live alerts */}
        <CyberCard title="Live Alerts" icon="⚠" subtitle={`${liveAlerts.length} pending`}>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {liveAlerts.length === 0 ? (
              <p className="font-mono text-cyber-dim text-xs text-center py-6 opacity-50">
                ✓ No active alerts
              </p>
            ) : (
              liveAlerts.slice(0, 15).map((alert, i) => (
                <AlertRow key={alert.id || i} alert={alert} />
              ))
            )}
          </div>
        </CyberCard>

        {/* Live logs */}
        <TerminalLog logs={liveLogs.slice(0, 40)} title="Live Terminal" maxHeight="264px" />
      </div>

      {/* ── System info ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Total Attacks"   value={overview?.totalAttacks      ?? 0} />
        <InfoCard label="Total Alerts"    value={overview?.totalAlerts       ?? 0} />
        <InfoCard label="Detections"      value={overview?.detections        ?? 0} />
        <InfoCard label="Uptime"          value={formatUptime(overview?.uptime)} />
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({ title, value, icon, bar = 0, barColor = '#00ff41' }) {
  return (
    <motion.div
      className="cyber-panel panel-corner p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider">{title}</span>
        <span className="text-sm" style={{ color: barColor, filter: `drop-shadow(0 0 4px ${barColor})` }}>{icon}</span>
      </div>
      <div className="font-display text-2xl font-bold" style={{ color: barColor, textShadow: `0 0 10px ${barColor}60` }}>
        {value}
      </div>
      <div className="progress-bar mt-2">
        <motion.div
          className="progress-fill"
          style={{ background: `linear-gradient(90deg, ${barColor}88, ${barColor})`, boxShadow: `0 0 6px ${barColor}80` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(bar, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function AlertRow({ alert }) {
  const colors = { low: 'text-green-400 bg-green-900/20', medium: 'text-amber-400 bg-amber-900/20', high: 'text-red-400 bg-red-900/20' };
  const cls = colors[alert.severity] || colors.low;
  return (
    <div className={`flex items-start gap-2 p-2 rounded border border-transparent hover:border-cyber-border transition-colors ${cls}`}>
      <span className="font-mono text-[9px] opacity-60 flex-shrink-0 mt-0.5">
        {new Date(alert.timestamp).toISOString().slice(11,19)}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded text-xs flex-shrink-0
        border border-current opacity-70">
        {alert.severity}
      </span>
      <span className="font-mono text-[10px] leading-relaxed break-words">{alert.message}</span>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="cyber-panel p-3 text-center">
      <div className="font-display text-xl text-cyber-green glow-text-sm">{value}</div>
      <div className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-cyber-panel rounded w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-cyber-panel rounded" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-52 bg-cyber-panel rounded" />)}
      </div>
    </div>
  );
}

function formatUptime(s = 0) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}
