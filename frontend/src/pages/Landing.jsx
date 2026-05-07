/**
 * pages/Landing.jsx
 * Animated hero landing page.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon: '⬡',
    title: 'Real-Time Detection',
    desc: 'Continuous monitoring with sub-second threat detection powered by heuristic pattern analysis.',
  },
  {
    icon: '◈',
    title: 'Attack Simulations',
    desc: 'Interactive demonstrations of Buffer Overflow, Trapdoor, and Cache Poisoning attack vectors.',
  },
  {
    icon: '⛨',
    title: 'Prevention Engine',
    desc: 'Automated countermeasures and guided recovery playbooks for every detected threat.',
  },
  {
    icon: '≡',
    title: 'Forensic Logs',
    desc: 'Immutable audit trail with severity classification, timestamps, and PDF export capability.',
  },
  {
    icon: '⚠',
    title: 'Smart Alerts',
    desc: 'WebSocket-powered real-time alert system with Low / Medium / High severity tiers.',
  },
  {
    icon: '⚙',
    title: 'Admin Control',
    desc: 'Full system state management, user administration, and simulation orchestration panel.',
  },
];

const TYPING_LINES = [
  '> Initializing Security Vulnerability Detection Framework...',
  '> Loading threat signatures database...',
  '> Connecting to monitoring subsystem...',
  '> Detection engine READY.',
  '> All systems NOMINAL.',
];

export default function Landing() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [lines, setLines] = useState([]);
  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  /* ── Typing effect ── */
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TYPING_LINES.length) {
        setLines(prev => [...prev, TYPING_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  /* ── Radar rotation ── */
  useEffect(() => {
    const t = setInterval(() => setScanAngle(a => (a + 2) % 360), 30);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black hex-bg relative overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4
        bg-cyber-black/80 backdrop-blur border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <RadarIcon size={28} />
          <div>
            <span className="font-display text-cyber-green text-sm font-bold glow-text-sm">SVDF</span>
            <span className="font-mono text-cyber-dim text-[10px] ml-2">v1.0.0</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="btn-neon text-xs px-5 py-2"
          >
            Access System
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pt-20 px-4">

        {/* Background glow */}
        <div className="absolute inset-0 bg-radial-green pointer-events-none" />

        {/* Rotating radar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <svg width="600" height="600" viewBox="0 0 600 600">
            <circle cx="300" cy="300" r="280" fill="none" stroke="#00ff41" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="200" fill="none" stroke="#00ff41" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="120" fill="none" stroke="#00ff41" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="40"  fill="none" stroke="#00ff41" strokeWidth="1" />
            <line x1="300" y1="300" x2="300" y2="20" stroke="#00ff41" strokeWidth="0.5" />
            <line x1="300" y1="300" x2="580" y2="300" stroke="#00ff41" strokeWidth="0.5" />
            <line x1="300" y1="300" x2="300" y2="580" stroke="#00ff41" strokeWidth="0.5" />
            <line x1="300" y1="300" x2="20"  y2="300" stroke="#00ff41" strokeWidth="0.5" />
            <g transform={`rotate(${scanAngle} 300 300)`}>
              <path d="M300,300 L580,200 A280,280 0 0,0 580,400 Z"
                fill="url(#radarGrad)" opacity="0.4" />
              <defs>
                <radialGradient id="radarGrad" cx="0%" cy="50%">
                  <stop offset="0%" stopColor="#00ff41" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
                </radialGradient>
              </defs>
            </g>
          </svg>
        </div>

        {/* ── Hero text ── */}
        <motion.div
          className="relative z-10 text-center max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <RadarIcon size={64} />
            </motion.div>
          </div>

          <motion.p
            className="font-mono text-cyber-dim text-xs uppercase tracking-[0.4em] mb-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            Operating Systems Project
          </motion.p>

          <motion.h1
            className="font-display text-4xl md:text-6xl font-black uppercase leading-tight mb-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          >
            <span className="glow-text text-cyber-green">Security</span>
            <br />
            <span className="text-white/80">Vulnerability</span>
            <br />
            <span className="glow-text text-cyber-green">Detection</span>
            <span className="text-white/60"> Framework</span>
          </motion.h1>

          <motion.p
            className="font-body text-cyber-dim text-sm mt-4 max-w-lg mx-auto leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            Real-time cyber threat monitoring, interactive attack simulations, and
            intelligent detection &amp; prevention — all in one system.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center mt-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          >
            <button
              onClick={() => navigate('/login')}
              className="btn-neon px-8 py-3 text-sm relative overflow-hidden group"
            >
              <span className="relative z-10">⚡ Start Simulation</span>
              <span className="absolute inset-0 bg-cyber-green opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 font-display text-xs uppercase tracking-widest
                text-cyber-dim border border-cyber-border hover:text-cyber-green
                hover:border-cyber-green transition-all duration-300"
            >
              Learn More ↓
            </button>
          </motion.div>
        </motion.div>

        {/* ── Terminal box ── */}
        <motion.div
          className="relative z-10 mt-12 w-full max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <div className="cyber-panel">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-cyber-border">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70 animate-pulse" />
              <span className="font-mono text-cyber-dim text-[10px] ml-2">svdf@terminal:~$</span>
            </div>
            <div className="px-4 py-3 min-h-[120px]">
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`font-mono text-xs leading-relaxed ${
                    i === lines.length - 1 ? 'text-cyber-green glow-text-sm' : 'text-cyber-dim'
                  }`}
                >
                  {line}
                </motion.p>
              ))}
              {lines.length < TYPING_LINES.length && (
                <span className="font-mono text-cyber-green text-xs cursor" />
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-cyber-border bg-cyber-dark/50">
        <div className="max-w-5xl mx-auto px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '3',     label: 'Attack Vectors' },
            { value: 'RT',    label: 'Real-Time Alerts' },
            { value: 'JWT',   label: 'Auth Security' },
            { value: '100%',  label: 'Log Coverage' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="font-display text-2xl font-black text-cyber-green glow-text">{stat.value}</div>
              <div className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-8 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl text-cyber-green uppercase tracking-[0.2em] glow-text-sm">
            System Capabilities
          </h2>
          <div className="h-px bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-40 mt-3" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="cyber-panel panel-corner p-5 hover:border-cyber-green/40 transition-colors group cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-2xl mb-3 glow-text group-hover:scale-110 transition-transform inline-block">
                {f.icon}
              </div>
              <h3 className="font-display text-xs text-cyber-green uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="font-body text-cyber-dim text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center py-16 px-8 border-t border-cyber-border">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-xl text-white mb-2 uppercase tracking-widest">
            Ready to Enter the
            <span className="text-cyber-green glow-text"> Matrix</span>?
          </h2>
          <p className="font-mono text-cyber-dim text-xs mb-6">Default credentials: admin / password123</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-neon px-10 py-4 text-sm"
          >
            ⚡ Launch SVDF System
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center py-6 border-t border-cyber-border">
        <p className="font-mono text-cyber-dim text-[10px] uppercase tracking-widest">
          SVDF © 2024 — Security Vulnerability Detection Framework — OS Project
        </p>
      </footer>
    </div>
  );
}

function RadarIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <polygon points="16,2 30,9 30,23 16,30 2,23 2,9"
        fill="none" stroke="#00ff41" strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,65,0.8))' }} />
      <polygon points="16,8 24,12 24,20 16,24 8,20 8,12"
        fill="rgba(0,255,65,0.08)" stroke="#00b32b" strokeWidth="1" />
      <circle cx="16" cy="16" r="3" fill="#00ff41"
        style={{ filter: 'drop-shadow(0 0 3px #00ff41)' }} />
    </svg>
  );
}
