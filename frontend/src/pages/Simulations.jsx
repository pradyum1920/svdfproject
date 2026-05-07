/**
 * pages/Simulations.jsx
 * Interactive attack simulation module.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { simulationAPI } from '../services/api.js';
import { useSocket }     from '../context/SocketContext.jsx';
import TerminalLog       from '../components/common/TerminalLog.jsx';
import StatusBadge       from '../components/common/StatusBadge.jsx';
import CyberCard         from '../components/common/CyberCard.jsx';

const ATTACKS = [
  {
    id:    'buffer_overflow',
    name:  'Buffer Overflow',
    icon:  '▓',
    color: '#ef4444',
    gist:  'Writes data beyond allocated memory bounds to overwrite adjacent memory and corrupt stack frames.',
    steps: ['Allocate fixed buffer', 'Inject oversized payload', 'Overwrite return address', 'Redirect execution flow'],
  },
  {
    id:    'trapdoor',
    name:  'Trapdoor / Backdoor',
    icon:  '⌖',
    color: '#f59e0b',
    gist:  'Inserts a hidden authentication bypass or secret entry point into a system, circumventing normal security.',
    steps: ['Identify authentication routine', 'Inject bypass condition', 'Create hidden admin token', 'Maintain persistent access'],
  },
  {
    id:    'cache_poisoning',
    name:  'Cache Poisoning',
    icon:  '⇌',
    color: '#8b5cf6',
    gist:  'Injects malicious content into a cache so future requests receive tampered data instead of legitimate responses.',
    steps: ['Intercept cache request', 'Craft malicious response', 'Force cache update', 'Serve poisoned content'],
  },
];

export default function Simulations() {
  const { liveAlerts, appendLog, liveLogs } = useSocket();
  const [selected,  setSelected]  = useState(ATTACKS[0]);
  const [running,   setRunning]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [simInfo,   setSimInfo]   = useState(null);
  const [payload,   setPayload]   = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectRes, setDetectRes] = useState(null);
  const [simStep,   setSimStep]   = useState(-1);

  /* ── Fetch attack knowledge base ── */
  useEffect(() => {
    simulationAPI.info(selected.id)
      .then(r => setSimInfo(r.data.data || r.data))
      .catch(() => setSimInfo(null));
    setResult(null);
    setDetectRes(null);
    setSimStep(-1);
  }, [selected]);

  /* ── Run simulation ── */
  async function startSim() {
    setRunning(true);
    setSimStep(0);
    setResult(null);
    appendLog({ level: 'system', message: `[SIM] Launching ${selected.name} simulation...` });

    try {
      // Animate steps
      for (let i = 0; i < selected.steps.length; i++) {
        await sleep(700);
        setSimStep(i);
        appendLog({ level: i === selected.steps.length - 1 ? 'error' : 'warn',
          message: `[SIM] Step ${i+1}: ${selected.steps[i]}` });
      }
      await sleep(600);

      const { data } = await simulationAPI.start(selected.id);
      setResult(data);
      appendLog({ level: 'error', message: `[SIM] Attack DETECTED — Severity: ${data?.severity?.toUpperCase() ?? 'HIGH'}` });
      toast.error(`${selected.name} detected!`, { icon: '🚨' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Simulation failed';
      appendLog({ level: 'error', message: `[SIM] Error: ${msg}` });
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }

  /* ── Detection scan ── */
  async function runDetect() {
    if (!payload.trim()) { toast.error('Enter a payload to scan'); return; }
    setDetecting(true);
    setDetectRes(null);
    try {
      const { data } = await simulationAPI.detect(payload);
      setDetectRes(data.data || data);
      appendLog({
        level: data.data?.detected ? 'error' : 'info',
        message: `[DETECT] Payload scanned — ${data.data?.detected ? 'THREAT FOUND' : 'Clean'}`,
      });
    } catch (err) {
      toast.error('Detection scan failed');
    } finally {
      setDetecting(false);
    }
  }

  const simLogs = liveLogs.filter(l => l.message?.includes('[SIM]') || l.message?.includes('[DETECT]'));

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-lg text-cyber-green uppercase tracking-wider glow-text-sm">
          Attack Simulations
        </h1>
        <p className="font-mono text-cyber-dim text-[10px] mt-0.5">
          INTERACTIVE VULNERABILITY DEMONSTRATION MODULE
        </p>
      </motion.div>

      {/* ── Attack selector ── */}
      <div className="grid grid-cols-3 gap-3">
        {ATTACKS.map((atk) => (
          <motion.button
            key={atk.id}
            onClick={() => setSelected(atk)}
            className={`cyber-panel p-4 text-left transition-all duration-200 ${
              selected.id === atk.id
                ? 'border-opacity-60 shadow-md'
                : 'hover:border-cyber-green/30'
            }`}
            style={selected.id === atk.id ? {
              borderColor: atk.color + '60',
              boxShadow: `0 0 20px ${atk.color}20`,
            } : {}}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl block mb-2"
              style={{ color: atk.color, filter: `drop-shadow(0 0 4px ${atk.color})` }}>
              {atk.icon}
            </span>
            <p className="font-display text-xs uppercase tracking-wide"
              style={{ color: selected.id === atk.id ? atk.color : '#00b32b' }}>
              {atk.name}
            </p>
          </motion.button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: info + animation */}
        <div className="lg:col-span-3 space-y-4">

          {/* Attack info */}
          <CyberCard title={selected.name} icon={selected.icon}>
            <p className="font-body text-cyber-dim text-xs leading-relaxed mb-4">{selected.gist}</p>

            {/* Simulation steps */}
            <div className="space-y-2">
              {selected.steps.map((step, i) => (
                <motion.div
                  key={step}
                  className={`flex items-center gap-3 p-2 rounded border transition-all duration-300 ${
                    simStep >= i
                      ? 'border-red-500/40 bg-red-900/10'
                      : 'border-cyber-border bg-transparent'
                  }`}
                  animate={simStep === i ? { x: [0, 4, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono flex-shrink-0
                    border ${simStep >= i ? 'border-red-500 bg-red-900/30 text-red-400' : 'border-cyber-border text-cyber-dim'}`}>
                    {simStep >= i ? '✓' : i + 1}
                  </span>
                  <span className={`font-mono text-[10px] ${simStep >= i ? 'text-red-400' : 'text-cyber-dim'}`}>
                    {step}
                  </span>
                  {simStep === i && (
                    <span className="ml-auto">
                      <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full spin block" />
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Visualization */}
            <div className="mt-4">
              <AttackVisualization type={selected.id} step={simStep} color={selected.color} />
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded border border-red-500/40 bg-red-900/10"
                >
                  <p className="font-mono text-xs text-red-400 mb-1">🚨 ATTACK DETECTED</p>
                  <p className="font-mono text-[10px] text-cyber-dim">
                    Severity: <span className="text-red-400 uppercase">{result.severity || result.data?.severity || 'HIGH'}</span>
                  </p>
                  <p className="font-mono text-[10px] text-cyber-dim">
                    Type: <span className="text-cyber-green">{selected.name}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start button */}
            <button
              onClick={startSim}
              disabled={running}
              className="mt-4 w-full btn-neon py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
              style={running ? {} : { borderColor: selected.color + '80', color: selected.color }}
            >
              {running ? (
                <>
                  <span className="w-4 h-4 border border-current border-t-transparent rounded-full spin" />
                  SIMULATING ATTACK...
                </>
              ) : (
                `▶ Run ${selected.name} Simulation`
              )}
            </button>
          </CyberCard>

          {/* Knowledge base */}
          {simInfo && (
            <CyberCard title="Attack Intelligence" icon="ℹ" subtitle={`From detection engine`}>
              <div className="grid grid-cols-2 gap-3">
                {simInfo.cause && (
                  <InfoBlock label="Cause" color="#ef4444">{simInfo.cause}</InfoBlock>
                )}
                {simInfo.detectionMethod && (
                  <InfoBlock label="Detection" color="#00ff41">{simInfo.detectionMethod}</InfoBlock>
                )}
                {simInfo.prevention && (
                  <InfoBlock label="Prevention" color="#00b32b">{simInfo.prevention}</InfoBlock>
                )}
                {simInfo.recovery && (
                  <InfoBlock label="Recovery" color="#f59e0b">{simInfo.recovery}</InfoBlock>
                )}
              </div>
            </CyberCard>
          )}
        </div>

        {/* Right: detect + logs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Detection scanner */}
          <CyberCard title="Detection Scanner" icon="⟳" subtitle="Test payloads">
            <textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              placeholder={`Enter suspicious payload...\ne.g. SELECT * FROM users\nor: <script>alert(1)</script>\nor: AAAAAAAAAAAAAAAA`}
              rows={5}
              className="w-full bg-cyber-black border border-cyber-border rounded px-3 py-2
                font-mono text-[10px] text-cyber-green placeholder-cyber-dim/40 resize-none
                focus:outline-none focus:border-cyber-green/50 transition-colors"
            />
            <button
              onClick={runDetect}
              disabled={detecting}
              className="mt-2 w-full btn-neon py-2 text-[10px] flex items-center justify-center gap-2"
            >
              {detecting ? (
                <><span className="w-3 h-3 border border-cyber-green border-t-transparent rounded-full spin" /> SCANNING...</>
              ) : '⟳ Run Detection Scan'}
            </button>

            <AnimatePresence>
              {detectRes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 rounded border"
                  style={{
                    borderColor: detectRes.detected ? '#ef444460' : '#22c55e60',
                    background:  detectRes.detected ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                  }}
                >
                  <p className="font-mono text-[10px]" style={{ color: detectRes.detected ? '#ef4444' : '#22c55e' }}>
                    {detectRes.detected ? '🚨 THREAT DETECTED' : '✓ PAYLOAD CLEAN'}
                  </p>
                  {detectRes.detected && (
                    <>
                      <p className="font-mono text-[9px] text-cyber-dim mt-1">
                        Pattern: <span className="text-amber-400">{detectRes.pattern || 'Anomalous'}</span>
                      </p>
                      <p className="font-mono text-[9px] text-cyber-dim">
                        Severity: <span className="text-red-400 uppercase">{detectRes.severity || 'high'}</span>
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CyberCard>

          {/* Sim terminal */}
          <TerminalLog logs={simLogs.length ? simLogs : liveLogs.slice(0, 20)} title="Simulation Output" maxHeight="320px" />
        </div>
      </div>
    </div>
  );
}

/* ── Attack Visualization ── */
function AttackVisualization({ type, step, color }) {
  if (type === 'buffer_overflow') return <BufferViz step={step} color={color} />;
  if (type === 'trapdoor')        return <TrapdoorViz step={step} color={color} />;
  if (type === 'cache_poisoning') return <CacheViz step={step} color={color} />;
  return null;
}

function BufferViz({ step, color }) {
  const cells = Array(12).fill(0);
  const overflow = step >= 1 ? 5 : 0;
  return (
    <div>
      <p className="font-mono text-[9px] text-cyber-dim mb-2 uppercase tracking-wider">Memory Layout</p>
      <div className="flex gap-1 flex-wrap">
        {cells.map((_, i) => (
          <motion.div
            key={i}
            className="w-7 h-7 flex items-center justify-center font-mono text-[8px] border rounded"
            animate={{
              borderColor: i < 5 ? (step >= 0 ? color + '80' : '#0f2b14') : (i < 5 + overflow ? '#ef4444' : '#0f2b14'),
              background:  i < 5 ? (step >= 0 ? color + '15' : 'transparent') : (i < 5 + overflow ? 'rgba(239,68,68,0.15)' : 'transparent'),
            }}
            transition={{ delay: i * 0.05 }}
          >
            {i < 5 ? (step >= 0 ? 'A' : '·') : (step >= 1 && i < 8 ? 'X' : '·')}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        <span className="font-mono text-[9px]" style={{ color }}>{step >= 0 ? '■ Buffer (filled)' : '□ Buffer (empty)'}</span>
        {step >= 1 && <span className="font-mono text-[9px] text-red-400">■ OVERFLOW</span>}
      </div>
    </div>
  );
}

function TrapdoorViz({ step, color }) {
  return (
    <div>
      <p className="font-mono text-[9px] text-cyber-dim mb-2 uppercase tracking-wider">Auth Bypass Flow</p>
      <div className="flex items-center gap-2">
        {['User', 'Auth', 'Gate', 'System'].map((node, i) => (
          <React.Fragment key={node}>
            <motion.div
              className="px-2 py-1.5 border rounded font-mono text-[9px] text-center"
              animate={{
                borderColor: step >= i ? color + '80' : '#0f2b14',
                color:       step >= i ? color : '#374151',
                background:  step >= i ? color + '10' : 'transparent',
              }}
            >
              {node}
            </motion.div>
            {i < 3 && (
              <motion.span
                className="font-mono text-[10px]"
                animate={{ color: step > i ? '#ef4444' : '#1f2937' }}
              >
                {step >= 2 && i === 1 ? '⇢' : '→'}
              </motion.span>
            )}
          </React.Fragment>
        ))}
      </div>
      {step >= 2 && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="font-mono text-[9px] text-red-400 mt-2"
        >
          ⌖ Backdoor injected — auth gate bypassed
        </motion.p>
      )}
    </div>
  );
}

function CacheViz({ step, color }) {
  return (
    <div>
      <p className="font-mono text-[9px] text-cyber-dim mb-2 uppercase tracking-wider">Cache Poisoning</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Request',   active: step >= 0, bad: false },
          { label: 'Cache',     active: step >= 1, bad: step >= 2 },
          { label: 'Response',  active: step >= 1, bad: step >= 3 },
        ].map((node) => (
          <motion.div
            key={node.label}
            className="p-2 border rounded text-center font-mono text-[9px]"
            animate={{
              borderColor: node.bad ? '#ef444460' : (node.active ? color + '60' : '#0f2b14'),
              background:  node.bad ? 'rgba(239,68,68,0.1)' : (node.active ? color + '10' : 'transparent'),
              color:       node.bad ? '#ef4444' : (node.active ? color : '#374151'),
            }}
          >
            {node.label}
            {node.bad && <span className="block text-[8px] text-red-400 mt-0.5">POISONED</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ label, color, children }) {
  return (
    <div className="p-2.5 rounded border" style={{ borderColor: color + '30', background: color + '06' }}>
      <p className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
      <p className="font-body text-cyber-dim text-[10px] leading-relaxed">{children}</p>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
