# Clairco Device Monitor

A real-time IoT device monitoring platform for smart-building sensors (air quality, HVAC, occupancy, etc). Devices publish heartbeat/telemetry over MQTT, the backend tracks online/offline status and raises email + in-app alerts when a device misses its expected check-in interval, and the React dashboard shows live device health, alert history, and trends.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design write-up and key technical decisions.

## Architecture

This is a single repository containing two independently run applications:

| App | Tech | Default port |
| --- | --- | --- |
| `backend/` | Node.js, Express, MongoDB (Mongoose), MQTT, Socket.IO | `5000` |
| `frontend/` | React 18 + Vite, MUI v5, Socket.IO client | `3000` |

Each app has its own `package.json`/`node_modules`/`.env` and is run independently, from inside its own folder — there is no root `package.json`. The frontend talks to the backend purely over HTTP/WebSocket using the URLs in its `.env`; nothing proxies one through the other.

```
Device / sensor  --MQTT-->  Mosquitto broker  --MQTT-->  backend (mqtt-listener)
                                                              |
                                                    MongoDB <-+-> Socket.IO --> frontend (live updates)
                                                              |
                                                       alert-scheduler --> nodemailer (email alerts)
```

- **Backend** ingests telemetry over MQTT (`devices/{deviceId}/telemetry`), updates each device's `lastHeartbeat`, and exposes a REST API (`/api/devices`, `/api/alerts`) plus a Socket.IO connection for real-time push (`device:heartbeat`, `device:status`, `alert:created`, `alert:resolved`, `alert:acknowledged`).
- A background scheduler polls device status every `ALERT_CHECK_INTERVAL_MS` and opens/closes alerts (with an optional email notification) when a device goes offline or comes back online.
- **Frontend** is a dashboard (Dashboard / Devices / Alert History pages) that fetches from the REST API and layers live Socket.IO updates on top.

## Prerequisites

- **Node.js 18+** (Node 20 recommended — matches the Docker images)
- **MongoDB** running locally or reachable via a connection string (a local install, or `mongod` via Docker)
- **Mosquitto (or any MQTT broker)** — optional unless you want to simulate real device telemetry. The REST API and dashboard both work without it.

## 1. Clone and install

```bash
git clone <this-repo-url>
cd clairco-device-monitor
```

Install each app's dependencies separately — they're independent projects:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 2. Configure environment variables

Each app has its own `.env`, copied from a committed `.env.example`.

```bash
# from the repo root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`** — key variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/clairco_monitor` |
| `PORT` | Backend HTTP port | `5000` |
| `FRONTEND_URL` | Allowed CORS origin / Socket.IO origin | `http://localhost:3000` |
| `API_KEY` | Shared secret required in the `x-api-key` header for API requests. **Leave blank to disable auth** (fine for local dev) | _(blank)_ |
| `MQTT_BROKER_URL`, `MQTT_TOPIC` | Where to listen for device telemetry | `mqtt://localhost:1883`, `devices/+/telemetry` |
| `MQTT_AUTO_CREATE_DEVICES` | If `true`, an unrecognized device ID publishing telemetry is auto-registered instead of ignored | `false` |
| `SMTP_*`, `ALERT_RECIPIENT` | Email alert delivery (optional — if unset, email sending is skipped and logged, everything else still works) | — |
| `RUN_DB_INTEGRATION` | Set `true` to enable the database integration test suite (needs a real, reachable MongoDB) | `false` |

**`frontend/.env`** — key variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend base URL for REST calls | `http://localhost:5000` |
| `VITE_WS_URL` | Backend URL for the Socket.IO connection | `ws://localhost:5000` |
| `VITE_API_KEY` | Must match the backend's `API_KEY`. Leave blank if the backend has no key set | _(blank)_ |

Vite only exposes env vars prefixed `VITE_` to client code (read via `import.meta.env.VITE_*`, see `frontend/src/config/index.js`) — this is a Vite convention, not optional.

The frontend's dev server is pinned to port **3000** in `vite.config.mjs` (Vite's own default is `5173`); the backend defaults to port **5000**. They're independent processes — nothing proxies one through the other in dev mode, they simply talk over the URLs above.

## 3. Start MongoDB

If you already have MongoDB running as a local service, skip this. Otherwise, start one however you prefer, e.g.:

```bash
mongod --dbpath /path/to/data/dir
```

## 4. Seed some demo devices (optional but recommended)

```bash
cd backend
npm run seed
```

This clears existing devices/alerts and inserts three demo sensors (`SENSOR-001`, `SENSOR-002`, `SENSOR-003`) so the dashboard isn't empty on first run.

## 5. Run both apps

Each app is started from inside its own folder, in its own terminal:

```bash
cd backend && npm run dev     # terminal 1 — nodemon, port 5000
```
```bash
cd frontend && npm run dev    # terminal 2 — Vite dev server, port 3000
```

You should see `MongoDB connected` and `Clairco Device Monitoring API listening on port 5000` from the backend, then the frontend compiling and opening `http://localhost:3000` — Dashboard shows the seeded devices (status "pending" until they send a heartbeat).

If no MQTT broker is reachable, you'll see MQTT connection errors retrying in the backend logs — that's expected and harmless; the REST API and dashboard don't depend on MQTT being connected.

Check the backend's healthy independently at any time:

```bash
curl http://localhost:5000/health
```

**Accessing the frontend from another device on your network** (e.g. `http://192.168.x.x:3000` instead of `localhost:3000`) works out of the box in development — the backend's CORS is wide open unless `NODE_ENV=production`, in which case only the origins listed in `FRONTEND_URL` are allowed.

## 6. (Optional) Simulate device telemetry over MQTT

If you have Mosquitto (or another broker) running locally on port `1883`, publish a test heartbeat for one of the seeded devices:

```bash
cd backend
MQTT_TEST_DEVICE_ID=SENSOR-001 node scripts/test-mqtt.js
```

Watch the dashboard update live via Socket.IO — the device flips to "online" without a page refresh. Run it again after `expectedInterval` seconds pass (or just wait) to see it flip to "offline" and raise an alert, which also pushes live to the Alert History page and Dashboard.

To let *any* device ID auto-register on first message instead of requiring it to be seeded first, set `MQTT_AUTO_CREATE_DEVICES=true` in `backend/.env`.

## Running with Docker Compose (alternative)

`docker-compose.yml` runs MongoDB, Mosquitto, the backend, and the frontend (built + served via nginx) together:

```bash
API_KEY=your-shared-secret docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Mosquitto: `mqtt://localhost:1883` (and websockets on `9001`)

`API_KEY` is optional — omit it (or leave it empty) to run without API authentication, same as in local dev.

## Testing

```bash
cd backend && npm test    # Jest — unit + integration suites
cd frontend && npm test   # Vitest + React Testing Library
```

Frontend production build: `npm run build` (outputs to `frontend/dist/`), preview it locally with `npm run preview`.

Backend linting/formatting: `npm run lint` / `npm run format` in either `backend/` or `frontend/` (both use ESLint + Prettier).

## Project structure

```
backend/
  src/
    config/       # env-driven config (db, mqtt, email)
    controllers/  # Express route handlers
    middleware/   # auth (API key), request validation
    models/       # Mongoose schemas (Device, Alert)
    routes/       # Express routers
    services/     # business logic: device-service, alert-service,
                   # alert-scheduler, mqtt-listener, socket-service, email-service
    utils/        # helpers, validators, logger
    workers/      # standalone alert-scheduler process (optional, `npm run worker`)
  scripts/        # seed-devices.js, test-mqtt.js
  tests/          # unit + integration Jest suites

frontend/
  src/
    api/          # axios client + REST calls
    components/   # presentational + composite components
    context/      # SocketProvider / DeviceProvider / AlertProvider (React Context)
    pages/        # Dashboard, DeviceManagement, AlertHistory
    styles/       # claymorphism theme tokens + MUI theme
    utils/        # formatters, status colors, pure helpers
```

## Notes on authentication

The API ships with a lightweight shared-secret scheme, not a full login system: set `API_KEY` on the backend and the matching `VITE_API_KEY` on the frontend, and every request must send it in the `x-api-key` header (the frontend's axios client does this automatically). If `API_KEY` is left blank, the backend accepts all requests unauthenticated — convenient for local development, but only appropriate on a trusted network.
