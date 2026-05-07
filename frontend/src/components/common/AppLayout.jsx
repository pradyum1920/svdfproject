/**
 * components/common/AppLayout.jsx
 * Persistent sidebar + top-bar shell wrapping all protected pages.
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth }   from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',    icon: '⬡' },
  { path: '/simulations', label: 'Simulations',  icon: '◈' },
  { path: '/alerts',      label: 'Alerts',       icon: '⚠' },
  { path: '/prevention',  label: 'Prevention',   icon: '⛨' },
  { path: '/logs',        label: 'Logs',         icon: '≡' },
];

const ADMIN_ITEM = { path: '/admin', label: 'Admin Panel', icon: '⚙' };

export default function AppLayout() {
  const { user, logout, isAdmin }      = useAuth();
  const { connected, liveAlerts, systemStatus } = useSocket();
  const [collapsed, setCollapsed]      = useState(false);
  const navigate                       = useNavigate();

  const statusColor = {
    safe:         'text-green-400',
    warning:      'text-amber-400',
    under_attack: 'text-red-400',
    critical:     'text-red-500',
  }[systemStatus] || 'text-green-400';

  const statusLabel = {
    safe:         'SECURE',
    warning:      'WARNING',
    under_attack: 'UNDER ATTACK',
    critical:     'CRITICAL',
  }[systemStatus] || 'SECURE';

  async function handleLogout() {
    await logout();
    toast.success('Session terminated');
    navigate('/login');
  }

  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-black relative z-10">

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col bg-cyber-dark border-r border-cyber-border relative overflow-hidden"
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-40" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-cyber-border">
          <div className="w-8 h-8 flex-shrink-0 relative">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <polygon points="16,2 30,9 30,23 16,30 2,23 2,9"
                fill="none" stroke="#00ff41" strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 0 4px #00ff41)' }} />
              <polygon points="16,8 24,12 24,20 16,24 8,20 8,12"
                fill="rgba(0,255,65,0.1)" stroke="#00b32b" strokeWidth="1" />
              <text x="16" y="20" textAnchor="middle" fill="#00ff41"
                fontSize="10" fontFamily="Orbitron">S</text>
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <p className="font-display text-cyber-green text-xs font-bold leading-none">SVDF</p>
                <p className="font-mono text-[9px] text-cyber-dim mt-0.5 leading-none">SEC·FRAMEWORK</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {items.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div className={`nav-item flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${isActive
                    ? 'active bg-cyber-panel text-cyber-green'
                    : 'text-cyber-dim hover:text-cyber-green hover:bg-cyber-panel/50'
                  }`}
                >
                  <span className="text-lg flex-shrink-0 w-6 text-center glow-text-sm">
                    {item.icon}
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-body text-xs uppercase tracking-widest whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.path === '/alerts' && liveAlerts.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {liveAlerts.length > 9 ? '9+' : liveAlerts.length}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-cyber-border p-3">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-2 px-1"
              >
                <p className="font-mono text-[10px] text-cyber-dim truncate">
                  USER: <span className="text-cyber-green">{user?.username?.toUpperCase()}</span>
                </p>
                <p className="font-mono text-[9px] text-cyber-dim mt-0.5">
                  ROLE: <span className={isAdmin ? 'text-amber-400' : 'text-cyber-dim'}>{user?.role?.toUpperCase()}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors rounded"
          >
            <span className="text-sm flex-shrink-0">⏻</span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="font-mono text-[10px] uppercase tracking-wider">
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-16 w-6 h-6 bg-cyber-panel border border-cyber-border rounded-full flex items-center justify-center text-cyber-dim hover:text-cyber-green hover:border-cyber-green transition-colors z-10"
        >
          <span className="text-[10px]">{collapsed ? '▶' : '◀'}</span>
        </button>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-12 flex-shrink-0 flex items-center justify-between px-6
          bg-cyber-dark border-b border-cyber-border relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-20" />

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${statusColor}`}>
              <span className={`status-dot ${
                systemStatus === 'safe' ? 'safe' :
                systemStatus === 'warning' ? 'warning' : 'critical'
              }`} />
              <span className="font-mono text-xs">SYS: {statusLabel}</span>
            </div>
          </div>

          {/* Right: time + socket */}
          <div className="flex items-center gap-4">
            <LiveClock />
            <div className={`flex items-center gap-1.5 font-mono text-[10px] ${connected ? 'text-cyber-dim' : 'text-red-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-cyber-green' : 'bg-red-500'}`} />
              {connected ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto hex-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[10px] text-cyber-dim">
      {time.toUTCString().slice(17, 25)} UTC
    </span>
  );
}
