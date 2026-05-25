# Mobile App Store Release Checklist

## Android (Driver + Parent)

- [ ] `versionCode` incremented
- [ ] Release signing keystore secured (not in repo)
- [ ] `google-services.json` — **production** Firebase project
- [ ] ProGuard/R8 rules for Flutter
- [ ] Background location permission rationale in Play listing
- [ ] Play Console — internal testing → closed → production
- [ ] Screenshots (phone + tablet)
- [ ] Data safety form completed
- [ ] Crash-free sessions >99% (Firebase Crashlytics / Sentry)

## iOS (Driver + Parent)

- [ ] Build number incremented
- [ ] `GoogleService-Info.plist` — production
- [ ] APNs key uploaded to Firebase
- [ ] Background modes: location, remote-notification
- [ ] App Store Connect metadata + privacy nutrition labels
- [ ] TestFlight soak 48h
- [ ] App Review notes: school transportation / live GPS

## Firebase

- [ ] Separate dev/staging/prod projects
- [ ] FCM service account only on backend
- [ ] Notification icons/channels (Android)

## Maps

- [ ] API key restricted by package + SHA-1 (Android) / bundle ID (iOS)

## Post-release

- [ ] Monitor Sentry for new issues
- [ ] Staged rollout 10% → 50% → 100%
