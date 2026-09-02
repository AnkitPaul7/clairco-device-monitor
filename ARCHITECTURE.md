# Architecture & Key Technical Decisions

## Problem statement

Operations needs to know, at a glance, which IoT devices are currently reporting in on schedule and which have gone silent — and get emailed the moment one misses its check-in window. That's the whole brief: **detect absence of expected MQTT traffic, alert on it, notify by email, show current status.** Everything in this document is in service of that, not of building a general-purpose IoT platform.

## System overview

```
Device / sensor  --MQTT-->  MQTT broker  --MQTT-->  backend: mqtt-listener
                                                            |
                                                (updates Device.lastHeartbeat)
                                                            |
                                                         MongoDB
                                                            |
                                    +-----------------------+-----------------------+
                                    |                                               |
                          backend: alert-scheduler                        Socket.IO broadcast
                          (polls every N seconds,                        (device:heartbeat,
                           compares now - lastHeartbeat                   device:status,
                           against expectedInterval)                      alert:created/resolved)
                                    |                                               |
                          creates/resolves Alert                                    |
                          docs in MongoDB                                           |
                                    |                                               |
                          backend: email-service                                    |
                          (nodemailer -> ALERT_RECIPIENT)                           |
                                                                                     v
                                                                        frontend: React dashboard
                                                                        (REST for initial load,
                                                                         Socket.IO for live updates)
```

Two independent apps, two independent processes, two ports (`backend` on 5000, `frontend` on 3000). The frontend never talks to MQTT directly — it only ever talks to the backend's REST API and Socket.IO connection. The backend is the single source of truth for device state.

## Why two triggers update device status, not one

There are two distinct paths that change what the dashboard shows:

1. **A message arrives** (`mqtt-listener.js`): the device is clearly online right now, so `Device.lastHeartbeat` is updated immediately and a Socket.IO event pushes the change to any open dashboard instantly.
2. **No message arrives** (`alert-scheduler.js`): this is a scheduler polling every `ALERT_CHECK_INTERVAL_MS` (default 15s), because absence of data is not an event anything can push to you — something has to actively notice the silence. It recomputes `online`/`offline`/`pending` for every device and opens or auto-resolves an `Alert` document when the computed status flips.

This split is the core design decision of the whole system: **presence is push-driven, absence is poll-driven**, because they're fundamentally different kinds of signal.

## Data model

**`Device`** (Mongoose/MongoDB): `deviceId` (unique, user-facing identifier), `name`, `expectedInterval` (seconds — this is the "define the expected communication interval" requirement), `lastHeartbeat`, `isActive`. Status (`online`/`offline`/`pending`) is **not stored** — it's a pure function of `(now, lastHeartbeat, expectedInterval)`, computed on every read (`utils/helpers.js#calculateDeviceStatus`). This avoids a whole class of bugs where a stored status field drifts out of sync with the timestamps it's supposed to reflect.

**`Alert`**: `deviceId`, `triggeredAt`, `resolvedAt`, `message`, `status` (`active`/`resolved`/`acknowledged`), `emailSent`. Alert creation is **idempotent** — before creating a new "offline" alert, the scheduler checks for an existing active alert for that device and reuses it, so a device that stays offline across many scheduler ticks doesn't spam duplicate alerts or duplicate emails.

## Key technical decisions

**MongoDB over a relational DB.** Devices and alerts are self-contained documents with no real relational joins needed (an alert only ever needs its own `deviceId` string, not a foreign-key relationship walked at query time). No migration ceremony for a prototype, and the schema is small and stable enough that a document store is a comfortable fit. (Note: the repo was actually started on Sequelize/Postgres and migrated to Mongoose mid-build — see "Known rough edges" below.)

**A polling scheduler over per-device timers.** An alternative design is N `setTimeout`s, one armed per device, firing exactly when that device's interval elapses ("dead man's switch" per device). It's more precise, but it doesn't survive a server restart without re-arming every timer from stored state, and it's meaningfully more code for a prototype at this scale. A single periodic sweep (`setInterval`, with an `isChecking` re-entrancy guard so a slow tick can't overlap the next one) is simpler to reason about and cheap enough at small-to-medium fleet sizes. The honest trade-off: at very large device counts this wouldn't be my first choice — you'd want to shard the sweep or move the "who's overdue" query into the database itself (e.g. an indexed range query) rather than iterating every device in application code.

**Socket.IO for real-time push, REST for initial load.** The dashboard fetches its initial state over REST (`GET /api/devices`, `GET /api/alerts`), then layers live updates on top via Socket.IO events (`device:heartbeat`, `device:status`, `alert:created`, `alert:resolved`, `alert:acknowledged`). This means the UI is never more than one scheduler tick stale, without polling the REST API from the browser.

**MQTT client with its own reconnect/backoff, decoupled from app logic.** `mqtt-listener.js` is a small class that owns its own exponential-backoff reconnect logic and is fully independent of Express/the scheduler — if the broker is unreachable, the REST API and dashboard keep working off whatever's already in MongoDB; only live telemetry ingestion pauses.

**Lightweight shared-secret auth, not full user accounts.** The brief doesn't ask for multi-user login, and building one (user model, sessions/JWT, password reset, etc.) would be exactly the kind of scope creep the assignment explicitly warns against. Instead: a single `API_KEY` env var, checked via an `x-api-key` header on every request, enabled only when set (blank = open, appropriate for local/trusted-network use). This closes the "the API had literally zero protection" gap without building a feature nobody asked for.

**Email delivery fails soft, not hard.** If SMTP credentials aren't configured, `email-service.js` logs and skips rather than throwing — the rest of the system (alerting, dashboard, MQTT ingestion) keeps working with no email account set up at all, which matters for anyone evaluating this without wanting to configure a mailbox first.

## Frontend structure

React + Vite, MUI v5 for components. State is split into three React Contexts (`SocketProvider`, `DeviceProvider`, `AlertProvider`) rather than a single global store — each owns one concern (the socket connection; device list + CRUD; alerts + their lifecycle actions) and the two data providers both consume the socket context to patch their state on incoming events. Three pages: Dashboard (status overview + recent alerts + a 7-day alert trend chart), Device Management (CRUD + per-device `expectedInterval` config), Alert History (filterable/paginated alert log).

## Known rough edges (being upfront about these)

- **Backend has a Jest test suite; the frontend does not.** Given the time box, correctness effort went into the alerting/scheduler logic (the part that's wrong-and-silent if it's wrong) over UI test coverage.
- **The polling-scheduler scaling limit** noted above — fine at prototype scale, would need revisiting for a large fleet.
- **Everything beyond the 5 core requirements** (claymorphism UI restyle, a dashboard trend chart, API-key auth, mobile navigation drawer) was added as polish/hardening on top of a working core, not as a substitute for it. None of it was required by the assignment; all of it is small enough to explain and justify in isolation if asked.
