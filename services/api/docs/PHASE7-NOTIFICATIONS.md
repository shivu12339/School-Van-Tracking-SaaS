# Phase 7 — Push Notifications & Geofence Alert Engine

## Architecture

```
Driver GPS update
  → TrackingService.processDriverLocation()
  → GeofenceService (5s throttle) → BullMQ geofence-processing
  → GeofenceAlertEngine (PostGIS ST_Distance)
  → NotificationDispatcher (dedup + rate limit + preferences)
  → PostgreSQL notifications (QUEUED)
  → BullMQ push-notifications
  → PushDeliveryService → FCM v1 multicast
  → Device tokens + delivery status
  → Socket.IO /notifications namespace
```

## Queues (BullMQ + Redis)

| Queue | Purpose |
|-------|---------|
| `push-notifications` | FCM delivery |
| `geofence-processing` | Proximity evaluation |
| `delayed-notifications` | Broadcast batches |
| `notification-retry` | Exponential backoff retries |
| `notification-analytics` | Delivery metrics |

## Notification types

All 11 types are templated in `src/notifications/templates/notification.templates.ts` with deep links (`schoolvan://...`).

## APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/notifications/register-device` | Register FCM token |
| GET | `/api/v1/notifications` | List history |
| PATCH | `/api/v1/notifications/:id/read` | Mark read |
| PATCH | `/api/v1/notifications/:id/click` | Track click |
| POST | `/api/v1/notifications/test` | Test push |
| POST | `/api/v1/notifications/broadcast` | School announcement |
| GET/PATCH | `/api/v1/notifications/preferences` | User preferences |
| GET | `/api/v1/notifications/analytics` | Delivery metrics |

## Environment

```env
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
REDIS_URL=redis://localhost:6379
```

Without FCM credentials, pushes are simulated (logged) for local development.

## Mobile integration

1. Register token: `POST /notifications/register-device`
2. Handle FCM data payload: `notificationId`, `type`, `deepLink`, `tripId`
3. Open screen from deep link
4. Connect WebSocket: `wss://api/notifications` with JWT
5. Listen for `notification:new`

## Migrations

```bash
cd services/api
npx prisma migrate dev --name phase7_notifications
```

## Scaling

- Run multiple API instances; BullMQ workers share Redis
- Increase worker concurrency in `NotificationWorkersService`
- Geofence jobs throttled per trip (5s) + Redis dedup per student/type
- Parent broadcast uses sequential dispatch; use `enqueueBroadcast` for very large schools
