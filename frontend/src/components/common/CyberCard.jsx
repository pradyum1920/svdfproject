/**
 * components/common/CyberCard.jsx
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function CyberCard({ title, subtitle, icon, children, className = '', accent = '#00ff41', animate = true }) {
  const card = (
    <div className={`cyber-panel panel-corner p-4 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-border">
          {icon && <span className="text-lg" style={{ color: accent, filter: `drop-shadow(0 0 4px ${accent})` }}>{icon}</span>}
          <div>
            {title    && <h3 className="font-display text-xs text-cyber-green uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="font-mono text-[9px] text-cyber-dim mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );

  if (!animate) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {card}
    </motion.div>
  );
}
