# 🛡️ SVDF — Security Vulnerability Detection Framework

## Backend API

Node.js · Express.js · Socket.io · JSON file storage · JWT Auth

---

## 📁 Folder Structure

```
backend/
├── server.js                  # Entry point — Express + Socket.io bootstrap
├── package.json
├── .env.example               # Copy to .env and configure
│
├── config/
│   └── config.js              # Centralised config (reads .env)
│
├── middleware/
│   ├── auth.js                # JWT authenticate + authorise + optionalAuth
│   ├── errorHandler.js        # Global 404 + error handler
│   └── validate.js            # express-validator result handler
│
├── routes/
│   ├── auth.js                # /api/auth/*
│   ├── dashboard.js           # /api/dashboard/*
│   ├── simulation.js          # /api/simulation/*
│   ├── alerts.js              # /api/alerts/*
│   ├── logs.js                # /api/logs/*
│   └── admin.js               # /api/admin/*   (admin role only)
│
├── controllers/
│   ├── authController.js      # register, login, refresh, me, logout
│   ├── dashboardController.js # overview, metrics, trend, status
│   ├── simulationController.js# start, stop, status, detect, info, ai-scan
│   ├── alertsController.js    # list, getOne, acknowledge, clear, test
│   ├── logsController.js      # list, download (PDF), clear, create
│   └── adminController.js     # state, reset, users CRUD, stats
│
├── services/
│   ├── storageService.js      # JSON file I/O (users, logs, alerts, state)
│   ├── detectionEngine.js     # Core threat detection & attack analysis
│   ├── simulationService.js   # Attack simulation orchestrator
│   └── socketService.js       # Socket.io server setup + emit helpers
│
├── utils/
│   └── logger.js              # Lightweight console logger
│
└── data/                      # JSON data files (auto-created if missing)
    ├── users.json             # User accounts (bcrypt-hashed passwords)
    ├── logs.json              # Log entries
    ├── alerts.json            # Alert records
    └── system_state.json      # Live system state
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET for production

# 4. Start the server
npm run dev      # development (nodemon auto-restart)
npm start        # production
```

The server starts at **http://localhost:5000**

---

## 🔐 Default Credentials

| Username  | Password     | Role  |
|-----------|--------------|-------|
| `admin`   | `password123` | admin |
| `analyst` | `password123` | user  |

> ⚠️ Change passwords immediately in production via the admin panel or `/api/admin/users/:id`.

---

## 📡 API Reference

### Authentication

| Method | Endpoint              | Auth | Body / Params                       | Description              |
|--------|-----------------------|------|-------------------------------------|--------------------------|
| POST   | `/api/auth/register`  | —    | `{ username, email, password }`     | Create a new account     |
| POST   | `/api/auth/login`     | —    | `{ username, password }`            | Get JWT tokens           |
| POST   | `/api/auth/refresh`   | —    | `{ refreshToken }`                  | Rotate access token      |
| GET    | `/api/auth/me`        | JWT  | —                                   | Current user profile     |
| POST   | `/api/auth/logout`    | JWT  | —                                   | Log out (client purges)  |

### Dashboard

| Method | Endpoint                     | Auth  | Description                        |
|--------|------------------------------|-------|------------------------------------|
| GET    | `/api/dashboard/overview`    | JWT   | Full dashboard snapshot            |
| GET    | `/api/dashboard/metrics`     | JWT   | CPU / memory / threat score        |
| GET    | `/api/dashboard/trend`       | JWT   | Attack trend buckets (chart data)  |
| GET    | `/api/dashboard/status`      | JWT   | System status string               |

### Simulation

| Method | Endpoint                        | Auth  | Body / Params                                   | Description                   |
|--------|---------------------------------|-------|-------------------------------------------------|-------------------------------|
| POST   | `/api/simulation/start`         | JWT   | `{ type, payload?, headers? }`                  | Start a named simulation      |
| POST   | `/api/simulation/stop`          | Admin | —                                               | Stop current simulation       |
| GET    | `/api/simulation/status`        | JWT   | —                                               | Is simulation running?        |
| POST   | `/api/simulation/detect`        | JWT   | `{ payload, attackType?, headers? }`            | One-shot detection scan       |
| GET    | `/api/simulation/info/:type`    | JWT   | type = buffer_overflow / trapdoor / cache_poi.. | Attack knowledge base         |
| POST   | `/api/simulation/ai-scan`       | JWT   | `{ payload?, cpu?, memory?, requestRate? }`     | AI anomaly scoring            |

### Alerts

| Method | Endpoint                   | Auth  | Description                    |
|--------|----------------------------|-------|--------------------------------|
| GET    | `/api/alerts`              | JWT   | List alerts (filter/paginate)  |
| GET    | `/api/alerts/:id`          | JWT   | Single alert                   |
| POST   | `/api/alerts/:id/ack`      | JWT   | Acknowledge an alert           |
| POST   | `/api/alerts/ack-all`      | JWT   | Acknowledge all alerts         |
| DELETE | `/api/alerts`              | Admin | Clear all alerts               |
| POST   | `/api/alerts/test`         | Admin | Generate a test alert          |

### Logs

| Method | Endpoint              | Auth  | Query Params                            | Description           |
|--------|-----------------------|-------|-----------------------------------------|-----------------------|
| GET    | `/api/logs`           | JWT   | `severity, attackType, limit, offset`   | List logs             |
| GET    | `/api/logs/download`  | JWT   | `severity?, attackType?`                | Download as PDF       |
| POST   | `/api/logs`           | JWT   | `{ message, severity?, attackType? }`   | Manual log entry      |
| DELETE | `/api/logs`           | Admin | —                                       | Clear all logs        |

### Admin Panel

| Method | Endpoint                        | Auth  | Description              |
|--------|---------------------------------|-------|--------------------------|
| GET    | `/api/admin/state`              | Admin | Full system state        |
| POST   | `/api/admin/reset`              | Admin | Reset system state       |
| GET    | `/api/admin/users`              | Admin | List all users           |
| PATCH  | `/api/admin/users/:id`          | Admin | Update user role/status  |
| DELETE | `/api/admin/users/:id`          | Admin | Deactivate user          |
| POST   | `/api/admin/users/:id/promote`  | Admin | Promote to admin         |
| GET    | `/api/admin/stats`              | Admin | Aggregate statistics     |

---

## 🔌 Socket.io Events

Connect to `ws://localhost:5000` with the Socket.io client.

### Server → Client

| Event                    | Payload                          | Description                        |
|--------------------------|----------------------------------|------------------------------------|
| `init_state`             | `{ state, alerts, logs }`        | Sent on connection                 |
| `simulation_started`     | `{ type, timestamp }`            | Simulation begin                   |
| `simulation_stopped`     | `{ timestamp }`                  | Simulation end                     |
| `detection_result`       | Detection result object          | Live detection output              |
| `metrics_update`         | `{ cpu, memory, threatScore, …}` | Every 2 s during simulation        |
| `live_log`               | `{ msg, severity, timestamp }`   | Random log lines during simulation |
| `new_alert`              | Alert object                     | New threat alert                   |
| `alert_acknowledged`     | `{ id }`                         | Alert ack'd                        |
| `all_alerts_acknowledged`| `{ count }`                      | Bulk ack                           |
| `alerts_cleared`         | `{}`                             | Alerts wiped                       |
| `system_reset`           | `{ by, timestamp }`              | Admin reset                        |
| `pong`                   | `{ ts }`                         | Response to `ping`                 |

### Client → Server

| Event               | Description                     |
|---------------------|---------------------------------|
| `subscribe_metrics` | Join the metrics broadcast room |
| `subscribe_alerts`  | Join the alerts broadcast room  |
| `request_state`     | Request a fresh `init_state`    |
| `ping`              | Keepalive check                 |

---

## 🗄️ JSON Storage Schema

### `data/logs.json`
```json
[
  {
    "id": "uuid",
    "timestamp": "ISO-8601",
    "severity": "low | medium | high | critical",
    "attackType": "buffer_overflow | trapdoor | cache_poisoning | system | ai_scan",
    "message": "Human-readable description",
    "source": "Component name"
  }
]
```

### `data/alerts.json`
```json
[
  {
    "id": "uuid",
    "timestamp": "ISO-8601",
    "severity": "low | medium | high",
    "attackType": "string",
    "title": "Short title",
    "message": "Detailed description",
    "details": {},
    "acknowledged": false,
    "acknowledgedAt": null
  }
]
```

### `data/system_state.json`
```json
{
  "simulationRunning": false,
  "activeAttack": null,
  "systemStatus": "safe | under_attack | critical",
  "threatScore": 0,
  "cpu": 12,
  "memory": 34,
  "startedAt": null,
  "stoppedAt": null,
  "totalAlertsGenerated": 0,
  "totalSimulationsRun": 0
}
```

---

## 🔧 Environment Variables

| Variable                  | Default                | Description                   |
|---------------------------|------------------------|-------------------------------|
| `PORT`                    | `5000`                 | Server port                   |
| `NODE_ENV`                | `development`          | Environment                   |
| `JWT_SECRET`              | (insecure default)     | **Change in production!**     |
| `JWT_REFRESH_SECRET`      | (insecure default)     | **Change in production!**     |
| `JWT_EXPIRES_IN`          | `1h`                   | Access token lifetime         |
| `JWT_REFRESH_EXPIRES_IN`  | `7d`                   | Refresh token lifetime        |
| `CLIENT_URL`              | `http://localhost:3000`| CORS allowed origin           |
| `RATE_LIMIT_WINDOW_MS`    | `900000` (15 min)      | Rate limit window             |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                  | Max requests per window       |
| `MAX_LOG_ENTRIES`         | `1000`                 | Max entries in logs.json      |
| `ALERT_RETENTION_HOURS`   | `24`                   | Hours to retain alerts        |

---

## 🧪 Testing with curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Set token
TOKEN="<paste token here>"

# Start buffer overflow simulation
curl -X POST http://localhost:5000/api/simulation/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"buffer_overflow"}'

# Quick detect
curl -X POST http://localhost:5000/api/simulation/detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"payload":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","attackType":"buffer_overflow"}'

# Get logs and download PDF
curl http://localhost:5000/api/logs \
  -H "Authorization: Bearer $TOKEN"

curl -o report.pdf "http://localhost:5000/api/logs/download" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🏗️ Architecture Notes

- **No database daemon** — all data lives in `data/*.json` files; safe for a single-process server.
- **Socket.io** shares the same HTTP server as Express — no extra port needed.
- **Detection engine** is pure heuristics + regex — no external ML dependencies.
- **PDF generation** uses PDFKit (pure JS) — no headless browser needed.
- **JWT** access tokens expire in 1 h; refresh tokens in 7 d — implement token rotation on the frontend.
- **bcrypt** cost factor 10 — fast enough for development, acceptable for production.

---

*SVDF Backend v1.0.0 — Built for OS Security course project*
