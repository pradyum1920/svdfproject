/**
 * components/common/TerminalLog.jsx
 * Scrolling terminal-style log display.
 */
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const LEVEL_CLASS = {
  error:  'terminal-line-error',
  warn:   'terminal-line-warn',
  info:   'terminal-line-info',
  system: 'terminal-line-system',
};

const LEVEL_PREFIX = {
  error:  '[CRIT]',
  warn:   '[WARN]',
  info:   '[ OK ]',
  system: '[SYS ]',
};

export default function TerminalLog({ logs = [], title = 'SYSTEM LOG', maxHeight = '280px' }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const ts = (iso) => {
    try {
      return new Date(iso).toISOString().slice(11, 19);
    } catch { return '00:00:00'; }
  };

  return (
    <div className="cyber-panel rounded">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <span className="text-cyber-green text-xs">▶</span>
          <span className="font-mono text-[10px] text-cyber-dim uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70 animate-pulse" />
        </div>
      </div>

      {/* Body */}
      <div className="terminal-body" style={{ maxHeight, minHeight: '120px' }}>
        {logs.length === 0 ? (
          <p className="text-cyber-dim opacity-50">
            {'>'} Awaiting events<span className="cursor" />
          </p>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={log.id || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2 leading-relaxed ${LEVEL_CLASS[log.level] || 'terminal-line-info'}`}
            >
              <span className="opacity-40 flex-shrink-0">{ts(log.timestamp)}</span>
              <span className="flex-shrink-0 opacity-70">{LEVEL_PREFIX[log.level] || '[ -- ]'}</span>
              <span className="break-all">{log.message}</span>
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
