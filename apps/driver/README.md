# School Van Driver App (Flutter)

Production driver client for GPS tracking, trip workflow, and realtime sync.

## Setup

1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.24+)
2. Generate platform folders (first time only):

```bash
cd apps/driver
flutter create . --org com.schoolvan.driver
```

3. Add Firebase (`android/app/google-services.json`, iOS `GoogleService-Info.plist`)
4. Set Google Maps API keys in `AndroidManifest.xml` and `AppDelegate.swift`
5. Enable Android foreground service permissions for background GPS

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run --dart-define=FLAVOR=dev
```

## Flavors

| Flavor | Define |
|--------|--------|
| dev | `FLAVOR=dev` |
| staging | `FLAVOR=staging` |
| prod | `FLAVOR=prod` |

## Demo login

- Email: seed driver (after `prisma db seed` with driver user)
- School code: `SVT-DEMO-001`
- Password: `Admin@12345`

## Architecture

- **Riverpod** — state
- **GoRouter** — navigation
- **Dio** — REST + token refresh
- **Socket.IO** — realtime tracking/events
- **Hive** — offline GPS + action queue
- **flutter_background_service** — background GPS (Android foreground service)

See `docs/ARCHITECTURE.md`.
