# Push Notifications & Geofence (Step 8)

Production notification pipeline for the School Van Tracking SaaS API.

## Pipeline

```
GPS update → GeofenceService → BullMQ geofence-processing
    → GeofenceAlertEngine (PostGIS ST_Distance)
    → Redis geofence cooldown + dedup
    → NotificationDispatcher → DB row (QUEUED)
    → BullMQ push-notifications
    → PushDeliveryService → FCM multicast
    → Socket /notifications (badge + inbox sync)
```

## BullMQ queues

| Queue | Purpose |
|-------|---------|
| `push-notifications` | FCM delivery jobs |
| `geofence-processing` | Proximity evaluation |
| `notification-retry` | Exponential backoff retries |
| `delayed-notifications` | Broadcast batches |
| `notification-analytics` | Delivery metrics |
| `notification-dlq` | Exhausted failures |

Workers run when `PROCESS_ROLE=worker` or `all`.

## Notification types

- `VAN_WITHIN_1KM` / `VAN_WITHIN_500M` — geofence (cooldown 1h / 30m)
- `STUDENT_PICKED` / `STUDENT_DROPPED`
- `VAN_REACHED_SCHOOL` / `RETURN_TRIP_STARTED`
- `SOS_EMERGENCY` — driver SOS
- `DRIVER_OFFLINE` / `TRIP_DELAYED`
- `SUBSCRIPTION_EXPIRY` / `SCHOOL_ANNOUNCEMENT`

## REST API (`/api/v1/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register-device` | Register FCM token |
| DELETE | `/devices/:deviceId` | Unregister device |
| GET | `/preferences` | User prefs |
| PATCH | `/preferences` | Update prefs |
| GET | `/unread-count` | Cached unread count |
| GET | `/` | Inbox (paginated) |
| PATCH | `/read-all` | Mark all read |
| PATCH | `/:id/read` | Mark one read |
| PATCH | `/:id/click` | Track deep-link open |
| POST | `/test` | Test push |
| POST | `/broadcast` | Admin announcement (queued) |
| GET | `/analytics` | School metrics |
| GET | `/admin/failed` | Failed / DLQ rows |
| POST | `/admin/retry` | Re-queue failed pushes |

## WebSocket (`/notifications`)

Auth: `handshake.auth.token` (JWT).

Events:

- `notification:connected`
- `notification:new` — payload + deep link
- `notification:badge` — `{ unread: number }`

Rooms: `user:{userId}`, `school:{schoolId}`.

## Deep links (mobile)

FCM `data` payload includes:

- `deepLink` — e.g. `schoolvan://trip/{tripId}/track`
- `notificationId`, `type`, `schoolId`, `tripId`
- `click_action: FLUTTER_NOTIFICATION_CLICK`

## Redis keys

| Key | TTL | Use |
|-----|-----|-----|
| `notify:dedup:{school}:{user}:{type}:{scope}` | per-event | Duplicate prevention |
| `notify:rate:{school}:{user}:{type}` | 1h window | Spam limit |
| `notify:cooldown:{school}:{trip}:{student}:{type}` | 30m–1h | Geofence dedup |
| `notify:unread:{school}:{user}` | 120s | Unread cache |
| `notify:analytics:{school}` | 60s | Admin dashboard |
| `notify:devices:{user}` | 300s | Active FCM tokens |

## Environment

```env
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=          # use \n for newlines in .env
FCM_CREDENTIALS_PATH=     # optional JSON service account path
REDIS_URL=redis://localhost:6379
PROCESS_ROLE=all          # or worker for BullMQ only
```

Without FCM credentials, pushes are **simulated** (logged, marked sent) for local dev.

## Security

- Tenant-scoped inbox and analytics
- Device tokens bound to user + school
- Broadcast restricted to `SCHOOL_ADMIN` / `SUPER_ADMIN`
- Rate limits per type; geofence + dedup cooldowns

## Running workers

```powershell
cd services/api
$env:PROCESS_ROLE="worker"
pnpm start:worker
```

API and workers must share the same `REDIS_URL` and database.
