# Tracking Module (Phase 6)

## Architecture

```txt
Driver App (GPS 3-5s)
  → Socket.IO /tracking (tracking:update)
  → TrackingService
      → Redis latest location + throttle
      → Redis Pub/Sub broadcast
      → Batch queue → tracking_logs (every 5s)
      → Geofence worker (PostGIS ST_Distance)
      → ETA cache
  → Parent/Admin sockets (van:location)
```

## Socket connection

```js
io('/tracking', {
  auth: {
    token: '<JWT>',
    tripId: '<active-trip-uuid>',
  },
});
```

## Rooms

- `school:{schoolId}`
- `trip:{tripId}`
- `parent:{parentId}`
- `driver:{driverId}`
- `admin:{schoolId}`

## REST fallback

- `POST /api/v1/tracking/trips/start`
- `POST /api/v1/tracking/trips/stop`
- `POST /api/v1/tracking/location`
- `POST /api/v1/tracking/sync` (offline batch)
- `GET /api/v1/tracking/trips/:tripId/live`
- `GET /api/v1/tracking/trips/:tripId/playback`

## Redis keys

- `school:{id}:trip:{tripId}:location` (TTL 120s)
- `school:{id}:van:{vanId}:location`
- `tracking:throttle:{tripId}` (3s)
- `geofence:sent:{tripId}:{studentId}:{type}` (dedup 24h)
- `eta:{tripId}:{studentId}` (TTL 60s)

## Scaling

- Socket.IO Redis adapter for multi-node broadcast
- Pub/Sub channels per trip and school
- Batched DB writes (200 rows / 5s)
