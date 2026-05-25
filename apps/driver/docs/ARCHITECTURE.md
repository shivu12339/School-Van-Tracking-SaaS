# Driver App Architecture

## Layers

```
presentation/ → providers, screens, widgets
domain/       → entities, repository interfaces
data/         → repositories, DTOs, API
services/     → cross-cutting (socket, GPS, sync, FCM)
core/         → network, errors, constants
```

## GPS pipeline (every 4s throttle)

1. `Geolocator` position stream (accuracy filter, mock rejection)
2. `TrackingSocketManager.emitTrackingUpdate` when socket connected
3. Else `OfflineSyncService.enqueueGps` → Hive
4. `OfflineSyncService.syncIfOnline` → `POST /tracking/sync`

## Background mode

- **Android**: `flutter_background_service` foreground notification
- **Foreground app**: `LocationTrackingService` stream
- **iOS**: background modes in Xcode + reduced frequency

## Socket.IO

- Namespace: `/tracking`
- Auth: JWT in handshake `auth.token`
- Reconnect: exponential delay, heartbeat every 25s

## Security

- Tokens in `flutter_secure_storage`
- Mock location rejected (`position.isMocked`)
- Optional SSL pinning via `AppConfig.enableSslPinning`

## Release

```bash
flutter build apk --release --dart-define=FLAVOR=prod
flutter build ipa --release --dart-define=FLAVOR=prod
```
