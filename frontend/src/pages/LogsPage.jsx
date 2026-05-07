/**
 * pages/LogsPage.jsx
 * Full audit log table with search, filter, and PDF export.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { logsAPI } from '../services/api.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PAGE_SIZE = 20;

export default function LogsPage() {
  const { isAdmin }              = useAuth();
  const [logs,     setLogs]      = useState([]);
  const [total,    setTotal]     = useState(0);
  const [page,     setPage]      = useState(1);
  const [loading,  setLoading]   = useState(true);
  const [search,   setSearch]    = useState('');
  const [severity, setSeverity]  = useState('');
  const [type,     setType]      = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(search   && { search }),
        ...(severity && { severity }),
        ...(type     && { type }),
      };
      const { data } = await logsAPI.list(params);
      setLogs(data.data?.logs || data.logs || []);
      setTotal(data.data?.total || data.total || 0);
    } catch { toast.error('Failed to load logs'); }
    finally  { setLoading(false); }
  }, [page, search, severity, type]);

  useEffect(() => { fetch(); }, [fetch]);

  /* ── Reset page on filter change ── */
  useEffect(() => { setPage(1); }, [search, severity, type]);

  async function downloadPDF() {
    setDownloading(true);
    try {
      const { data } = await logsAPI.download();
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url; link.download = `svdf-logs-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally  { setDownloading(false); }
  }

  async function clearLogs() {
    if (!confirm('Clear all logs? This cannot be undone.')) return;
    try {
      await logsAPI.clear();
      setLogs([]); setTotal(0);
      toast.success('Logs cleared');
    } catch { toast.error('Failed to clear logs'); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-lg text-cyber-green uppercase tracking-wider glow-text-sm">
            Logs & Reports
          </h1>
          <p className="font-mono text-cyber-dim text-[10px] mt-0.5">
            AUDIT TRAIL — {total} TOTAL ENTRIES
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="btn-neon text-[10px] px-4 py-1.5 border-blue-500/50 text-blue-400"
          >
            {downloading ? '...' : '↓ Export PDF'}
          </button>
          {isAdmin && (
            <button onClick={clearLogs}
              className="btn-neon text-[10px] px-4 py-1.5 border-red-500/50 text-red-400">
              ✕ Clear Logs
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search logs..."
          className="bg-cyber-black border border-cyber-border rounded px-3 py-2
            font-mono text-xs text-cyber-green placeholder-cyber-dim/40 flex-1 min-w-40
            focus:outline-none focus:border-cyber-green/50 transition-colors"
        />
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          className="bg-cyber-black border border-cyber-border rounded px-3 py-2
            font-mono text-xs text-cyber-green focus:outline-none focus:border-cyber-green/50"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-cyber-black border border-cyber-border rounded px-3 py-2
            font-mono text-xs text-cyber-green focus:outline-none focus:border-cyber-green/50"
        >
          <option value="">All Types</option>
          <option value="buffer_overflow">Buffer Overflow</option>
          <option value="trapdoor">Trapdoor</option>
          <option value="cache_poisoning">Cache Poisoning</option>
          <option value="detection">Detection</option>
          <option value="system">System</option>
        </select>
        <button onClick={fetch}
          className="btn-neon text-[10px] px-4 py-2">
          ⟳ Refresh
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border border-cyber-green border-t-transparent rounded-full spin mx-auto" />
        </div>
      ) : (
        <div className="cyber-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border">
                  {['Timestamp', 'Type', 'Severity', 'Message', 'Source'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase
                      tracking-wider text-cyber-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 font-mono text-cyber-dim text-xs">
                      No logs found
                    </td>
                  </tr>
                ) : logs.map((log, i) => (
                  <motion.tr
                    key={log.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="log-row border-b border-cyber-border/30 hover:bg-cyber-panel/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-[9px] text-cyber-dim whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="attack-badge bg-cyber-panel border border-cyber-border text-cyber-dim">
                        {log.type?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={log.severity || 'low'} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-cyber-green max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[9px] text-cyber-dim">
                      {log.source || log.ip || '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-cyber-border">
              <span className="font-mono text-[9px] text-cyber-dim">
                Page {page} of {totalPages} — {total} entries
              </span>
              <div className="flex gap-1">
                <PagBtn label="«" onClick={() => setPage(1)} disabled={page === 1} />
                <PagBtn label="‹" onClick={() => setPage(p => p - 1)} disabled={page === 1} />
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <PagBtn key={p} label={p} onClick={() => setPage(p)} active={p === page} />
                  );
                })}
                <PagBtn label="›" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} />
                <PagBtn label="»" onClick={() => setPage(totalPages)} disabled={page === totalPages} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PagBtn({ label, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 font-mono text-[10px] border rounded transition-colors
        ${active
          ? 'border-cyber-green text-cyber-green bg-cyber-green/10'
          : 'border-cyber-border text-cyber-dim hover:border-cyber-green hover:text-cyber-green'}
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
