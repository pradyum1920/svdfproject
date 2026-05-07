/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        matrix: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        cyber: {
          black:  '#020b04',
          dark:   '#050f07',
          darker: '#030808',
          panel:  '#071209',
          border: '#0f2b14',
          green:  '#00ff41',
          dim:    '#00b32b',
          glow:   '#00ff4180',
        },
        threat: {
          low:    '#22c55e',
          medium: '#f59e0b',
          high:   '#ef4444',
          critical:'#dc2626',
        },
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"Exo 2"', 'sans-serif'],
      },
      boxShadow: {
        'green-sm':   '0 0 10px rgba(0,255,65,0.15)',
        'green-md':   '0 0 20px rgba(0,255,65,0.25)',
        'green-lg':   '0 0 40px rgba(0,255,65,0.35)',
        'green-glow': '0 0 60px rgba(0,255,65,0.5)',
        'red-glow':   '0 0 30px rgba(239,68,68,0.4)',
        'amber-glow': '0 0 30px rgba(245,158,11,0.4)',
        'panel':      'inset 0 0 30px rgba(0,255,65,0.03)',
      },
      animation: {
        'matrix-rain':  'matrixRain 10s linear infinite',
        'pulse-green':  'pulseGreen 2s ease-in-out infinite',
        'scan-line':    'scanLine 3s ease-in-out infinite',
        'flicker':      'flicker 0.15s infinite',
        'type':         'typing 3s steps(30,end)',
        'blink':        'blink 1s step-end infinite',
        'threat-pulse': 'threatPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        matrixRain: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,255,65,0.2)' },
          '50%':      { boxShadow: '0 0 25px rgba(0,255,65,0.6)' },
        },
        scanLine: {
          '0%':   { top: '0%', opacity: 1 },
          '100%': { top: '100%', opacity: 0 },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.8 },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0 },
        },
        threatPulse: {
          '0%, 100%': { opacity: 0.7 },
          '50%':      { opacity: 1 },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)`,
        'radial-green': 'radial-gradient(ellipse at center, rgba(0,255,65,0.07) 0%, transparent 70%)',
        'scanlines':    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
