# Realtime GPS Tracking (Step 7)

Production realtime stack for the School Van Tracking SaaS API.

## Architecture

```
Driver App ──WebSocket/HTTP──► TrackingGateway / TrackingController
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            GpsIntegrityService  TrackingCache (Redis)  TrackingPubSub
                    │                 │                 │
                    ▼                 │                 ▼
            TrackingBatchService ─────┴──► BullMQ `tracking-persist`
                    │                           │
                    ▼                           ▼
            GeofenceService ──► Notification Queue   Worker → PostgreSQL tracking_logs
            EtaService ──► Redis ETA keys + pub/sub → Parent `eta:update`
```

- **Socket.IO** namespace: `/tracking` with **Redis adapter** (horizontal scale).
- **Tenant rooms**: `school:{id}`, `trip:{id}`, `driver:{id}`, `parent:{id}`, `admin:{id}`.
- **Auth**: JWT in `handshake.auth.token` or `Authorization: Bearer`.

## Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| Trips | `src/trips/` | CRUD, schedule daily legs, analytics, cancel |
| Tracking | `src/tracking/` | GPS ingest, gateway, cache, batch, geofence, ETA |
| WebSocket | `src/websocket/` | Aggregator marker; adapters in bootstrap |

## REST API

### Trips (`/api/v1/trips`)

- `GET /` — list trips (paginated)
- `GET /active` — in-progress trips (Redis + DB)
- `GET /analytics?from=&to=` — status/direction counts
- `POST /` — create trip + auto-assign route students
- `POST /schedule` — morning PICKUP + evening DROPOFF for route
- `GET /:tripId` — detail with students
- `PATCH /:tripId` — update (scheduled only unless status transition)
- `POST /:tripId/cancel` — cancel scheduled trip

### Tracking (`/api/v1/tracking`)

- `POST /trips/start` | `POST /trips/stop` — driver lifecycle
- `POST /location` — HTTP GPS fallback (3–5s throttle)
- `POST /sync` — offline batch replay (sorted by timestamp)
- `GET /trips/:tripId/live` — latest Redis location
- `GET /trips/:tripId/playback?from=&to=` — up to 5000 points
- `PUT /trips/:tripId/students/:studentId/pickup|dropoff`
- `POST /trips/:tripId/sos`

## Socket events

### Driver → server

| Event | Payload |
|-------|---------|
| `trip:start` | `{ tripId }` |
| `trip:stop` | `{ tripId }` |
| `tracking:update` | GPS + `tripId` |
| `student:picked` | `{ tripId, studentId }` |
| `student:dropped` | `{ tripId, studentId }` |
| `sos:triggered` | `{ tripId, latitude?, longitude?, description? }` |
| `ping` | — (heartbeat) |

### Server → clients

| Event | Audience |
|-------|----------|
| `van:location` | `trip:{id}`, parents |
| `eta:update` | `trip:{id}` |
| `trip:status` | `trip:{id}` |
| `driver:online` | `admin:{schoolId}` |
| `trip:started` / `trip:ended` | admin |
| `sos:alert` | admin |
| `server:connected` | connecting client |
| `pong` | heartbeat reply |

## Redis keys

| Key pattern | TTL | Purpose |
|-------------|-----|---------|
| `school:{schoolId}:trip:{tripId}:location` | 120s | Latest van position |
| `school:{schoolId}:van:{vanId}:location` | 120s | Van-scoped location |
| `school:{schoolId}:activeTrips` | 24h | SET of active trip IDs |
| `school:{schoolId}:driver:{driverId}:activeTrip` | 24h | Driver → trip mapping |
| `tracking:throttle:{tripId}` | 3s | GPS rate limit |
| `tracking:reconnect:{tripId}` | 300s | Reconnect snapshot |
| `tracking:lastSample:{tripId}` | 1h | Fake GPS / teleport context |
| `eta:{tripId}:{studentId}` | 60s | Cached ETA |
| `geofence:sent:{tripId}:{studentId}:{type}` | 24h | Dedup |

Pub/sub channels: `tracking:trip:{tripId}`, `tracking:school:{schoolId}`, `tracking:eta:{tripId}`.

## BullMQ queues

| Queue | Job | Worker |
|-------|-----|--------|
| `tracking-persist` | `flush-batch` | Batch insert `tracking_logs` |
| `tracking-analytics` | `track-event` | In-process metrics counters |

Run workers: `PROCESS_ROLE=worker` (see `worker.main.ts`).

## Trip state machine

```
SCHEDULED → IN_PROGRESS → COMPLETED
     ↓           ↓
 CANCELLED   CANCELLED (only before complete; stop first if in progress)
```

Constraints:

- One `IN_PROGRESS` trip per driver and per van.
- Driver must own trip to send GPS or start/stop.

## Fake GPS detection

`GpsIntegrityService` flags:

- `MOCK_LOCATION` (`isMocked: true` from client)
- `IMPOSSIBLE_SPEED` (>150 km/h)
- `TELEPORT` (>80 m/s implied speed vs last sample)
- `LOW_ACCURACY_HIGH_SPEED`
- `FUTURE_TIMESTAMP` / `STALE_TIMESTAMP`

Rejected when `riskScore >= 80`.

## Client integration

```javascript
const socket = io('https://api.example.com/tracking', {
  auth: { token: accessToken, tripId: 'uuid' },
  transports: ['websocket'],
});
socket.on('van:location', (payload) => { /* map update */ });
socket.emit('tracking:update', { tripId, latitude, longitude, speed, heading, timestamp: new Date().toISOString() });
```

## Environment

- `REDIS_URL` — cache, pub/sub, Socket.IO adapter, BullMQ
- `DATABASE_URL` — PostGIS `tracking_logs`
- `PROCESS_ROLE` — `all` (default API+WS) or `worker`
