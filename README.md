# 🛡️ SVDF — Security Vulnerability Detection Framework

> **Operating Systems Project** — Full-Stack Cybersecurity Monitoring Application

A production-grade web application featuring real-time threat monitoring, interactive attack simulations, and intelligent detection & prevention — built with a dark hacker-style UI.

---

## 📁 Project Structure

```
svdf-fullstack/
├── backend/                    # Node.js + Express.js API
│   ├── config/
│   │   └── config.js           # Central configuration
│   ├── controllers/            # Route handler logic
│   │   ├── adminController.js
│   │   ├── alertsController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── logsController.js
│   │   └── simulationController.js
│   ├── data/                   # JSON file storage
│   │   ├── alerts.json
│   │   ├── logs.json
│   │   ├── system_state.json
│   │   └── users.json
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── routes/                 # Express routers
│   │   ├── admin.js
│   │   ├── alerts.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── logs.js
│   │   └── simulation.js
│   ├── services/
│   │   ├── detectionEngine.js  # Threat detection logic
│   │   ├── simulationService.js
│   │   ├── socketService.js    # Socket.io real-time
│   │   └── storageService.js   # JSON file I/O
│   ├── utils/
│   │   └── logger.js
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Entry point
│
├── frontend/                   # React.js + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── AppLayout.jsx   # Sidebar shell
│   │   │       ├── CyberCard.jsx   # Panel card
│   │   │       ├── MatrixRain.jsx  # Canvas background
│   │   │       ├── StatusBadge.jsx
│   │   │       └── TerminalLog.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # JWT auth state
│   │   │   └── SocketContext.jsx   # WebSocket events
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Hero landing page
│   │   │   ├── Login.jsx           # Auth form
│   │   │   ├── Dashboard.jsx       # Main monitoring
│   │   │   ├── Simulations.jsx     # Attack simulations
│   │   │   ├── AlertsPage.jsx      # Alert management
│   │   │   ├── Prevention.jsx      # Response playbooks
│   │   │   ├── LogsPage.jsx        # Audit logs + PDF
│   │   │   └── AdminPanel.jsx      # Admin controls
│   │   ├── services/
│   │   │   └── api.js              # Axios + token refresh
│   │   ├── App.jsx                 # Route config
│   │   ├── main.jsx                # Bootstrap
│   │   └── index.css               # Global styles
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json                # Root scripts (concurrently)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **npm** v9+

### 1 — Clone / Extract

```bash
unzip svdf-fullstack.zip
cd svdf-fullstack
```

### 2 — Install Dependencies

```bash
# Install root + both packages at once
npm run install:all
```

Or manually:

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 3 — Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

The defaults work out-of-the-box for local development. For production, update the JWT secrets in `backend/.env`.

### 4 — Run (Development)

```bash
# From project root — runs both servers concurrently
npm run dev
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| Backend  | http://localhost:5000       |
| API Docs | http://localhost:5000/api   |
| Health   | http://localhost:5000/health |

### 5 — Default Credentials

| Username  | Password    | Role  |
|-----------|-------------|-------|
| admin     | password123 | Admin |
| analyst   | password123 | User  |

---

## 🔑 Features

### 🏠 Landing Page
- Animated radar + matrix rain background
- Typewriter terminal boot sequence
- Feature showcase grid
- "Start Simulation" CTA

### 📊 Dashboard
- Live CPU, Memory, Threat Score gauges with progress bars
- Attack trend area chart (24h)
- Attack type breakdown bar chart
- Real-time alert feed (via Socket.io)
- Live terminal log panel
- System status indicator (Safe / Warning / Critical)

### ⚡ Attack Simulations
Three interactive simulations with step-by-step animation:

| Attack | Description |
|--------|-------------|
| **Buffer Overflow** | Visual memory layout, overflow animation, stack corruption |
| **Trapdoor/Backdoor** | Auth bypass flow diagram, injection visualization |
| **Cache Poisoning** | Cache layer diagram, poisoning propagation |

Each includes:
- Explanation panel
- Step-by-step visual animation
- Detection scanner (test your own payloads)
- Knowledge base from backend API
- Live output terminal

### 🚨 Alerts
- Real-time alert stream via Socket.io
- Severity filter tabs (High / Medium / Low)
- Acknowledge individual or all alerts
- Test alert trigger button
- Merged live + persistent alerts

### 🛡️ Prevention & Recovery
Accordion playbooks for each attack type:
- **Cause** — Root cause analysis
- **Detection** — How it was found
- **Prevention** — Hardening measures
- **Recovery** — Incident response steps

### 📋 Logs
- Paginated audit log table
- Search + severity + type filters
- PDF export (via backend pdfkit)
- Admin-only log clear

### ⚙️ Admin Panel
- Start / Stop simulations with type selector
- Live system state viewer
- User management (promote / delete)
- Aggregate statistics

### 🔐 Authentication
- JWT access + refresh tokens
- Auto token refresh on 401
- Role-based access (admin / user)
- Route guards for protected pages

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ✗ | Login, returns JWT pair |
| POST | `/api/auth/register` | ✗ | Register new user |
| GET  | `/api/auth/me` | ✓ | Current user profile |
| GET  | `/api/dashboard/overview` | ✓ | KPI summary |
| GET  | `/api/dashboard/metrics` | ✓ | CPU/RAM/threat score |
| GET  | `/api/dashboard/trend` | ✓ | Hourly attack trend |
| POST | `/api/simulation/start` | ✓ | Start an attack simulation |
| POST | `/api/simulation/stop` | Admin | Stop simulation |
| POST | `/api/simulation/detect` | ✓ | Scan a payload |
| GET  | `/api/simulation/info/:type` | ✓ | Attack knowledge base |
| GET  | `/api/alerts` | ✓ | List alerts |
| POST | `/api/alerts/ack-all` | ✓ | Acknowledge all |
| DELETE | `/api/alerts` | Admin | Clear all alerts |
| GET  | `/api/logs` | ✓ | Paginated logs |
| GET  | `/api/logs/download` | ✓ | Export PDF |
| DELETE | `/api/logs` | Admin | Clear logs |
| GET  | `/api/admin/state` | Admin | System state |
| POST | `/api/admin/reset` | Admin | Reset state |
| GET  | `/api/admin/users` | Admin | All users |
| POST | `/api/admin/users/:id/promote` | Admin | Promote user |

---

## 🔌 Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `alert:new` | Server→Client | Alert object |
| `log:new` | Server→Client | Log entry |
| `system:status` | Server→Client | `{ status }` |
| `metrics:update` | Server→Client | `{ cpu, memory, threatScore }` |
| `simulation:started` | Server→Client | `{ type }` |
| `simulation:stopped` | Server→Client | — |
| `simulation:event` | Server→Client | `{ message, severity }` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Animation | Framer Motion |
| Charts | Recharts |
| HTTP | Axios (with interceptors) |
| Real-time | Socket.io Client |
| Notifications | react-hot-toast |
| Backend | Node.js, Express.js |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Storage | JSON files (no database) |
| Real-time | Socket.io |
| PDF | pdfkit |
| Security | helmet, express-rate-limit, cors |

---

## 🏭 Production Build

```bash
# Build frontend
npm run build

# The dist/ folder can be served by any static host.
# Backend can be deployed to any Node.js host.

# Start backend in production mode
NODE_ENV=production npm start --prefix backend
```

> **Note:** Update `CLIENT_URL` in `backend/.env` to match your deployed frontend URL.

---

## 🎓 Academic Context

This project was built as part of an **Operating Systems** course to demonstrate:

- **Process Isolation** — Simulating buffer overflow stack corruption
- **Privilege Escalation** — Trapdoor / backdoor authentication bypass
- **Shared Resource Vulnerabilities** — Cache poisoning shared memory attacks
- **Real-Time Monitoring** — OS-level metrics (CPU/memory) simulation
- **Security Policies** — Role-based access control implementation

---

*SVDF — Security Vulnerability Detection Framework · v1.0.0*
