# School Van Driver App (Flutter)

Production driver mobile app at `apps/driver` (`schoolvan_driver`).

## Stack

- **Flutter** 3.5+, **Riverpod**, **GoRouter**
- **Dio** REST + JWT refresh
- **socket_io_client** realtime tracking
- **Hive** offline GPS + action queues
- **geolocator** + **flutter_background_service** background GPS
- **google_maps_flutter** route map
- **firebase_messaging** push notifications
- **flutter_secure_storage** tokens

## Run locally

```bash
cd apps/driver
flutter pub get
flutter create . --platforms=android,ios   # first time: generates android/ ios/
flutter run --dart-define=FLAVOR=dev --dart-define=GOOGLE_MAPS_KEY=YOUR_KEY
```

Demo driver: `driver@demo-school.app` / `Admin@12345` / school code `SVT-DEMO-001`

## Architecture

Feature-first clean layout under `lib/`:

| Area | Responsibility |
|------|----------------|
| `features/auth` | Login, session restore, secure tokens |
| `features/dashboard` | Today's trips, connection status |
| `features/trips` | Trip detail, start/stop lifecycle |
| `features/students` | Swipe pick/drop + HTTP + offline queue |
| `features/tracking` | Active trip state, GPS entities |
| `features/maps` | Google Map, polylines, stops |
| `features/sos` | Emergency alert (socket + HTTP + offline) |
| `services/` | Dio, socket, location, sync, FCM, Hive |

## GPS flow (every ~4s)

1. Foreground: `LocationTrackingService` (accuracy filter, mock rejection)
2. Background: `BackgroundLocationService` isolate → Hive `gps_queue`
3. Socket `tracking:update` when connected; else HTTP `POST /tracking/location`
4. Offline: enqueue → `POST /tracking/sync` batch on reconnect

## Offline sync

`OfflineSyncService` replays:

- GPS batches per trip
- Queued `student_picked` / `student_dropped` (PUT + socket)
- Queued `sos` (POST + socket)

Triggered on app resume, connectivity restore, and trip stop.

## Release builds

```bash
flutter build apk --release \
  --dart-define=FLAVOR=prod \
  --dart-define=GOOGLE_MAPS_KEY=$GOOGLE_MAPS_KEY

flutter build ios --release \
  --dart-define=FLAVOR=prod \
  --dart-define=GOOGLE_MAPS_KEY=$GOOGLE_MAPS_KEY
```

Enable SSL pinning in prod via `AppConfig.enableSslPinning` and `lib/core/security/ssl_pinning.dart`.

## Android permissions

After `flutter create`, ensure `AndroidManifest.xml` includes:

- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`
- `POST_NOTIFICATIONS` (API 33+)
- Battery optimization exemption prompt (handled in-app via `permission_handler`)

## Tests

```bash
flutter test
```
