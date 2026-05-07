/**
 * components/common/StatusBadge.jsx
 */
import React from 'react';

const CONFIGS = {
  low:          { bg: 'bg-green-900/40',  border: 'border-green-500/50', text: 'text-green-400',  dot: 'bg-green-400'  },
  medium:       { bg: 'bg-amber-900/40',  border: 'border-amber-500/50', text: 'text-amber-400',  dot: 'bg-amber-400'  },
  high:         { bg: 'bg-red-900/40',    border: 'border-red-500/50',   text: 'text-red-400',    dot: 'bg-red-400'    },
  critical:     { bg: 'bg-red-900/60',    border: 'border-red-400/70',   text: 'text-red-300',    dot: 'bg-red-300'    },
  safe:         { bg: 'bg-green-900/30',  border: 'border-green-600/40', text: 'text-green-400',  dot: 'bg-green-400'  },
  warning:      { bg: 'bg-amber-900/30',  border: 'border-amber-600/40', text: 'text-amber-400',  dot: 'bg-amber-400'  },
  under_attack: { bg: 'bg-red-900/40',    border: 'border-red-500/60',   text: 'text-red-400',    dot: 'bg-red-400'    },
};

export default function StatusBadge({ status, label, pulse = false }) {
  const cfg = CONFIGS[status?.toLowerCase()] || CONFIGS.safe;
  const display = label || status?.toUpperCase().replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border
      font-mono text-[10px] uppercase tracking-wider ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {display}
    </span>
  );
}
