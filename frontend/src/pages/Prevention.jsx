/**
 * pages/Prevention.jsx
 * Prevention & Recovery reference for each attack type.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ATTACKS = [
  {
    id: 'buffer_overflow',
    name: 'Buffer Overflow',
    icon: '▓',
    color: '#ef4444',
    cause: [
      'Use of unsafe C/C++ functions (strcpy, gets, sprintf) without bounds checking.',
      'Lack of stack canaries or address-space layout randomization (ASLR).',
      'Programs compiled without stack protection flags (-fstack-protector).',
      'Accepting user input without validating length constraints.',
    ],
    detection: [
      'Stack canary values checked at function return — mismatch triggers termination.',
      'Memory watchdog timers monitoring abnormal allocation patterns.',
      'Static analysis tools (Valgrind, AddressSanitizer) flagging boundary violations.',
      'Anomaly detection on process memory maps for unexpected write patterns.',
    ],
    prevention: [
      'Always use bounds-checked functions: strncpy, snprintf, fgets.',
      'Compile with -fstack-protector-all and enable ASLR at OS level.',
      'Enable Data Execution Prevention (DEP/NX bit) to block code injection.',
      'Use memory-safe languages (Rust, Go) for security-critical components.',
      'Apply Address Space Layout Randomization (ASLR) to make exploitation harder.',
    ],
    recovery: [
      'Immediately isolate affected process and terminate with core dump for analysis.',
      'Review crash logs to determine the exploited buffer and injection payload.',
      'Patch the vulnerable code section with proper bounds checking.',
      'Rotate all credentials and tokens that may have been exfiltrated.',
      'Conduct post-mortem memory forensics to identify full attack scope.',
    ],
  },
  {
    id: 'trapdoor',
    name: 'Trapdoor / Backdoor',
    icon: '⌖',
    color: '#f59e0b',
    cause: [
      'Malicious insiders or compromised developers inserting hidden authentication bypasses.',
      'Supply chain attacks where a dependency ships with an embedded backdoor.',
      'Default credentials or hard-coded passwords left in production builds.',
      'Undocumented maintenance accounts created during development and never removed.',
    ],
    detection: [
      'Code review and static analysis for hardcoded credentials or suspicious conditions.',
      'Behavioral monitoring for unusual authentication patterns or privilege escalations.',
      'Network traffic analysis detecting outbound beaconing to C2 servers.',
      'File integrity monitoring (FIM) alerting on unexpected binary modifications.',
    ],
    prevention: [
      'Mandatory multi-reviewer code review for all authentication logic.',
      'Automated CI/CD scanning with secret-detection tools (Gitleaks, TruffleHog).',
      'Never allow default credentials in production — enforce rotation at first boot.',
      'Software Bill of Materials (SBOM) to audit all third-party dependencies.',
      'Least-privilege principle: no single component should have unrestricted access.',
    ],
    recovery: [
      'Revoke all access tokens, certificates, and API keys immediately.',
      'Audit authentication logs to enumerate unauthorized access sessions.',
      'Rebuild and redeploy from a clean, verified source code baseline.',
      'Notify affected stakeholders and conduct a full supply chain audit.',
      'Engage incident response team for threat actor attribution analysis.',
    ],
  },
  {
    id: 'cache_poisoning',
    name: 'Cache Poisoning',
    icon: '⇌',
    color: '#8b5cf6',
    cause: [
      'Caching layers that fail to validate or canonicalize request headers before storage.',
      'Web servers that include user-controlled input in cache keys without sanitization.',
      'Inconsistent cache key definitions between CDN and origin server.',
      'HTTP response splitting vulnerabilities allowing header injection.',
    ],
    detection: [
      'Cache integrity checks comparing stored content hashes against trusted baselines.',
      'Anomaly detection on cache hit/miss ratios and response-time deviations.',
      'Monitoring for unexpected redirects or content changes in cached responses.',
      'Web Application Firewall (WAF) rules flagging header injection attempts.',
    ],
    prevention: [
      'Implement strict cache key policies including all relevant request parameters.',
      'Validate and sanitize all user-controlled headers before caching responses.',
      'Use Cache-Control headers (no-store, private) for sensitive or user-specific data.',
      'Deploy WAF with rules targeting HTTP request splitting and header injection.',
      'Separate caches for authenticated vs. unauthenticated content.',
    ],
    recovery: [
      'Immediately flush and purge all cache layers (CDN, reverse proxy, application).',
      'Identify the poisoned cache entries through access log analysis.',
      'Patch the underlying vulnerability — typically header validation or cache key logic.',
      'Notify users who may have received poisoned content during the attack window.',
      'Monitor cache health metrics for 48h post-incident for recurrence.',
    ],
  },
];

const SECTIONS = [
  { key: 'cause',      label: 'Cause',            icon: '◉', color: '#ef4444' },
  { key: 'detection',  label: 'Detection Method',  icon: '⬡', color: '#00ff41' },
  { key: 'prevention', label: 'Prevention',        icon: '⛨', color: '#00b32b' },
  { key: 'recovery',   label: 'Recovery Steps',    icon: '↺', color: '#f59e0b' },
];

export default function Prevention() {
  const [selected, setSelected] = useState(ATTACKS[0]);
  const [expanded, setExpanded] = useState('cause');

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-lg text-cyber-green uppercase tracking-wider glow-text-sm">
          Prevention & Recovery
        </h1>
        <p className="font-mono text-cyber-dim text-[10px] mt-0.5">
          INCIDENT RESPONSE KNOWLEDGE BASE
        </p>
      </motion.div>

      {/* ── Attack selector ── */}
      <div className="grid grid-cols-3 gap-3">
        {ATTACKS.map((atk) => (
          <motion.button
            key={atk.id}
            onClick={() => { setSelected(atk); setExpanded('cause'); }}
            className={`cyber-panel p-4 text-left border transition-all duration-200`}
            style={selected.id === atk.id ? {
              borderColor: atk.color + '60',
              boxShadow: `0 0 20px ${atk.color}15`,
            } : {}}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <div className="text-2xl mb-2" style={{
              color: selected.id === atk.id ? atk.color : '#00b32b',
              filter: `drop-shadow(0 0 4px ${atk.color}60)`,
            }}>
              {atk.icon}
            </div>
            <p className="font-display text-[10px] uppercase tracking-wide"
              style={{ color: selected.id === atk.id ? atk.color : '#00b32b' }}>
              {atk.name}
            </p>
          </motion.button>
        ))}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {/* Header */}
          <div className="cyber-panel p-4 flex items-center gap-4">
            <span className="text-3xl" style={{
              color: selected.color,
              filter: `drop-shadow(0 0 8px ${selected.color})`,
            }}>
              {selected.icon}
            </span>
            <div>
              <h2 className="font-display text-sm uppercase tracking-wider" style={{ color: selected.color }}>
                {selected.name}
              </h2>
              <p className="font-mono text-[10px] text-cyber-dim mt-0.5">
                ATTACK TYPE — COMPREHENSIVE RESPONSE PLAYBOOK
              </p>
            </div>
          </div>

          {/* Accordion sections */}
          {SECTIONS.map((sec) => (
            <AccordionSection
              key={sec.key}
              section={sec}
              items={selected[sec.key]}
              isOpen={expanded === sec.key}
              onToggle={() => setExpanded(expanded === sec.key ? '' : sec.key)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AccordionSection({ section, items, isOpen, onToggle }) {
  return (
    <div className="cyber-panel overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyber-panel/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: section.color, filter: `drop-shadow(0 0 4px ${section.color})` }}>
            {section.icon}
          </span>
          <span className="font-display text-xs uppercase tracking-wider" style={{ color: section.color }}>
            {section.label}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="font-mono text-cyber-dim text-xs"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-cyber-border pt-3">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3"
                >
                  <span className="font-mono text-[10px] mt-0.5 flex-shrink-0"
                    style={{ color: section.color }}>
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <p className="font-body text-cyber-dim text-xs leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
