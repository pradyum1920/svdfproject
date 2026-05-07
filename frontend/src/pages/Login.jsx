/**
 * pages/Login.jsx
 * JWT login / register form with cybersecurity theme.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [loading,  setLoading]  = useState(false);
  const [fields,   setFields]   = useState({ username: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(fields.username, fields.password);
        toast.success('Access granted. Welcome back.');
      } else {
        await register(fields);
        toast.success('Account created. Access granted.');
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cyber-black hex-bg flex items-center justify-center px-4 relative z-10">

      {/* Background circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[300, 500, 700].map((r) => (
          <div key={r}
            className="absolute border border-cyber-green/5 rounded-full"
            style={{ width: r, height: r, top: -r/2, left: -r/2 }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <polygon points="32,4 60,18 60,46 32,60 4,46 4,18"
                fill="none" stroke="#00ff41" strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.6))' }} />
              <polygon points="32,16 50,24 50,40 32,48 14,40 14,24"
                fill="rgba(0,255,65,0.06)" stroke="#00b32b" strokeWidth="1" />
              <text x="32" y="38" textAnchor="middle" fill="#00ff41"
                fontSize="16" fontFamily="Orbitron" fontWeight="bold"
                style={{ filter: 'drop-shadow(0 0 4px #00ff41)' }}>S</text>
            </svg>
          </div>
          <h1 className="font-display text-xl text-cyber-green uppercase tracking-[0.2em] glow-text-sm">
            SVDF Access
          </h1>
          <p className="font-mono text-cyber-dim text-[10px] mt-1 uppercase tracking-widest">
            Security Clearance Required
          </p>
        </div>

        {/* Card */}
        <div className="cyber-panel panel-corner p-6">
          {/* Mode toggle */}
          <div className="flex mb-6 bg-cyber-black rounded">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider transition-all
                  ${mode === m
                    ? 'text-cyber-green border-b-2 border-cyber-green'
                    : 'text-cyber-dim hover:text-cyber-green'
                  }`}
              >
                {m === 'login' ? '⟶ Login' : '＋ Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <Field
              label="USERNAME"
              type="text"
              value={fields.username}
              onChange={set('username')}
              placeholder="e.g. admin"
              required
            />

            {/* Email (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Field
                    label="EMAIL"
                    type="email"
                    value={fields.email}
                    onChange={set('email')}
                    placeholder="user@domain.com"
                    required={mode === 'register'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div className="relative">
              <Field
                label="PASSWORD"
                type={showPass ? 'text' : 'password'}
                value={fields.password}
                onChange={set('password')}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 bottom-2.5 font-mono text-[9px] text-cyber-dim hover:text-cyber-green"
              >
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neon py-3 mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border border-cyber-green border-t-transparent rounded-full spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>⚡ {mode === 'login' ? 'AUTHENTICATE' : 'CREATE ACCOUNT'}</span>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-4 p-3 bg-cyber-black rounded border border-cyber-border">
            <p className="font-mono text-[9px] text-cyber-dim uppercase tracking-wider mb-1">Default Credentials:</p>
            <p className="font-mono text-[10px] text-cyber-green">admin / password123 <span className="text-amber-400">[ADMIN]</span></p>
            <p className="font-mono text-[10px] text-cyber-dim">analyst / password123 <span className="text-cyber-dim">[USER]</span></p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="font-mono text-cyber-dim text-[10px] hover:text-cyber-green transition-colors">
            ← Back to Landing
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block font-mono text-[9px] text-cyber-dim uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-cyber-black border border-cyber-border rounded px-3 py-2.5
          font-mono text-xs text-cyber-green placeholder-cyber-dim/40
          focus:outline-none focus:border-cyber-green/50 focus:shadow-green-sm
          transition-all duration-200"
      />
    </div>
  );
}
