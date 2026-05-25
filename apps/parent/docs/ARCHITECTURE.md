# Parent App Architecture

Enterprise Flutter app using **feature-first clean architecture**, **Riverpod**, and **GoRouter**.

## Layering

```
lib/
├── config/           # Flavors, API/WS base URLs
├── core/             # Dio, errors, connectivity, lifecycle, security
├── shared/           # Theme tokens, reusable widgets
├── features/         # auth, dashboard, tracking, maps, students, trips, notifications, settings
├── services/         # Socket, FCM, Hive cache, analytics, deep links
└── routes/           # GoRouter + auth redirects
```

Each feature follows:

```
feature/
├── data/         # Repositories, DTO parsing
├── domain/       # Entities
├── presentation/ # Screens, providers, widgets
```

## Live tracking flow

1. Parent opens child → `LiveTrackingNotifier` loads `GET /parent/children/:id/active-trip`
2. `ParentSocketManager` connects to `/tracking` with JWT + `tripId`
3. Socket events update `LiveTrackingState`; REST seeds initial position/ETA
4. `AnimatedVanMarkerController` interpolates marker moves between `van:location` events
5. `EtaCard` shows cached ETA; refreshes on `eta:update` or polling fallback

## Socket strategy

| Concern | Implementation |
|---------|----------------|
| Auth | JWT in `auth` handshake payload |
| Reconnect | Socket.IO client with 2s delay |
| Heartbeat | `ping` every 25s while connected |
| Teardown | Disconnect on `LiveTrackingNotifier.dispose` |

## Offline

- `ParentCache` (Hive): trip snapshot per student, notification list
- `NotificationRepository` falls back to cache on network failure
- Connectivity banner on dashboard

## Security

- Tokens in `flutter_secure_storage` (encrypted prefs on Android)
- Dio interceptor: Bearer token + refresh on 401
- SSL pinning hook in `core/security/ssl_pinning.dart` (enabled for `prod` flavor)
- Parent API enforces `RoleCode.PARENT` + student ownership server-side

## Push & deep links

- FCM registers via `POST /notifications/register-device`
- Foreground: `flutter_local_notifications`
- Payload `route` navigates via bound `GoRouter`
- `uni_links`: `schoolvan://track/{studentId}` → `/child/{id}/track`

## Release

- Android: `flutter build appbundle --dart-define=FLAVOR=prod`
- iOS: `flutter build ipa --dart-define=FLAVOR=prod`
- Separate Firebase projects per flavor (recommended)

## API reference

| Endpoint | Purpose |
|----------|---------|
| `GET /parent/children` | Linked children |
| `GET /parent/children/:id/active-trip` | In-progress trip |
| `GET /parent/trips/:tripId/live` | Van position |
| `GET /parent/trips/:tripId/eta` | ETA for child |
| `GET /parent/trips/:tripId/playback` | History polyline |
| `GET /notifications` | Alert history |
