# School Van Parent App (Flutter)

Production parent mobile app at `apps/parent` (`schoolvan_parent`).

## Stack

- Flutter 3.5+, Riverpod, GoRouter
- Dio REST + JWT refresh
- Socket.IO (`/tracking` namespace) for live van, ETA, student status
- Hive offline cache (children, trip state, notifications)
- Google Maps live tracking + route playback
- Firebase Cloud Messaging + local notifications
- flutter_secure_storage, uni_links deep links, l10n (English)

## Run locally

```bash
cd apps/parent
flutter pub get
flutter create . --platforms=android,ios
flutter run --dart-define=FLAVOR=dev --dart-define=GOOGLE_MAPS_KEY=YOUR_KEY
```

**Demo parent:** use a seeded parent account with school code `SVT-DEMO-001` and password `Admin@12345`.

## Features

| Feature | Description |
|---------|-------------|
| **Auth** | Login, session restore, token refresh, logout |
| **Dashboard** | Children list, unread notification badge, offline banner |
| **Live tracking** | Socket van location + HTTP fallback, animated marker, ETA card |
| **Student status** | Timeline (waiting → picked → dropped), realtime socket updates |
| **Driver profile** | Name, phone (tap-to-call), van & route details |
| **Notifications** | Paginated list, read/unread, cache offline, deep link to map |
| **Trip history** | Past trips with route playback on map |
| **Deep links** | `schoolvan://track/{studentId}`, `/notifications` |

## Socket events (parent)

- `van:location` — van GPS
- `eta:update` — ETA minutes + distance
- `trip:status` — trip lifecycle
- `student:picked` / `student:dropped`
- `notification:new` — in-app refresh

## REST API (`/api/v1/parent/...`)

- `GET /parent/children`
- `GET /parent/children/:studentId/active-trip`
- `GET /parent/trips/:tripId/live?studentId=`
- `GET /parent/trips/:tripId/eta?studentId=`
- `GET /parent/trips/:tripId/playback?studentId=`
- `GET /parent/children/:studentId/trip-history`

Notifications: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`.

## Offline behavior

- Children and notifications fall back to Hive cache when offline
- Active trip state cached per student; map shows last known position
- Connectivity watcher refreshes data when network returns

## Release

```bash
flutter build apk --release --dart-define=FLAVOR=prod --dart-define=GOOGLE_MAPS_KEY=$KEY
```

SSL pinning: enable via `AppConfig.enableSslPinning` and `lib/core/security/ssl_pinning.dart`.

## Tests

```bash
flutter test
```
