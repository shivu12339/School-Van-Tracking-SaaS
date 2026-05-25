# Load & Stress Tests

Requires [k6](https://k6.io/docs/get-started/installation/).

```bash
# API health (no auth)
k6 run tests/load/k6/api-health.js

# GPS flood (requires driver token + trip)
AUTH_TOKEN=eyJ... TRIP_ID=uuid API_URL=https://staging-api.example.com \
  k6 run tests/load/k6/gps-flood.js

# Socket readiness proxy
VUS=200 k6 run tests/load/k6/socket-stress.js

# Notification read burst (admin JWT)
AUTH_TOKEN=... k6 run tests/load/k6/notification-burst.js
```

## Realtime smoke (Node)

```bash
npm i socket.io-client  # from repo root if needed
AUTH_TOKEN=... TRIP_ID=... node tests/realtime/socket-smoke.mjs
```

Scheduled weekly on staging via `.github/workflows/load-test.yml`.
