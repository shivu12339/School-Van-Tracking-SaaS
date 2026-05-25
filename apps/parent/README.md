# School Van Parent App (Flutter)

Production parent client for live van tracking, child pickup/drop status, push alerts, and trip history.

## Setup

1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.24+)
2. Generate platform folders (first time only):

```bash
cd apps/parent
flutter create . --org com.schoolvan.parent
```

3. Add Firebase (`android/app/google-services.json`, iOS `GoogleService-Info.plist`)
4. Set Google Maps API keys in `AndroidManifest.xml` and `AppDelegate.swift`
5. Configure deep links (`schoolvan://track/{studentId}`) in Android intent filters / iOS URL types

```bash
flutter pub get
flutter gen-l10n
flutter run --dart-define=FLAVOR=dev
```

## Flavors

| Flavor | Define | API |
|--------|--------|-----|
| dev | `FLAVOR=dev` | `http://10.0.2.2:4000` (Android emulator) |
| staging | `FLAVOR=staging` | staging API |
| prod | `FLAVOR=prod` | production + SSL pinning flag |

## Demo login

After `npx prisma db seed` in `services/api`:

| Field | Value |
|-------|-------|
| Email | `parent@demo-school.app` |
| Password | `Admin@12345` |
| School code | `SVT-DEMO-001` |

## Features

- Username/password auth with secure token storage and auto-refresh
- Live van map with animated marker, ETA card, route polyline
- Socket.IO realtime: `van:location`, `trip:status`, `student:picked`, `student:dropped`, `eta:update`, `notification:new`
- Push notifications (FCM) with foreground local notifications and deep links
- Notification history with read/unread and offline cache
- Trip history and route playback
- Driver emergency contact sheet
- Offline banner + Hive cache for trips/notifications

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
