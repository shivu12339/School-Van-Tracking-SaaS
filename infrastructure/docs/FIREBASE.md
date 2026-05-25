# Firebase (FCM) Production Setup

## Project structure

| Environment | Firebase project |
|-------------|------------------|
| dev | `schoolvan-dev` |
| staging | `schoolvan-staging` |
| production | `schoolvan-prod` |

## Backend (Railway)

1. Firebase Console → Project settings → Service accounts → Generate key.
2. Set Railway env:

```
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Escape newlines as `\n` in Railway UI.

## Android (Driver + Parent)

1. Add Android apps with package IDs `com.schoolvan.driver` / `com.schoolvan.parent`.
2. Download `google-services.json` into each app's `android/app/`.
3. Restrict API keys in Google Cloud Console.

## iOS

1. Add iOS bundles, download `GoogleService-Info.plist`.
2. Enable push capability + APNs key in Firebase.

## Notification types

- Geofence: 1km / 500m alerts
- Student picked / dropped
- School announcements (broadcast queue)

## Security

- Never commit service account JSON to git.
- Use separate Firebase projects per environment.
- Rotate keys annually.

## AWS migration

Firebase unchanged — only backend hosting moves to ECS.
