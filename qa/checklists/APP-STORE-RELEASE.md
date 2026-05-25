# App Store / Play Store release checklist

## Android (Driver + Parent)

- [ ] `flutter build appbundle --release --dart-define=FLAVOR=prod`
- [ ] Signing keystore in secure vault (not in git)
- [ ] `google-services.json` production Firebase project
- [ ] Maps API key restricted (package name + SHA-1)
- [ ] Background location permission justification in Play Console
- [ ] Foreground service declaration for driver GPS
- [ ] Privacy policy URL live
- [ ] Target API level meets Play requirements
- [ ] ProGuard/R8 rules if minification enabled

## iOS

- [ ] Apple Developer account + provisioning profiles
- [ ] `GoogleService-Info.plist` production
- [ ] `NSLocationWhenInUseUsageDescription` + background modes text
- [ ] Push notification capability enabled
- [ ] TestFlight soak 48h
- [ ] App Store Connect privacy nutrition labels

## Crash reporting

- [ ] Sentry or Firebase Crashlytics DSN in prod flavor
- [ ] Symbol upload configured in CI (`flutter-release.yml`)

## Post-release

- [ ] Monitor Sentry for new release spikes
- [ ] Verify FCM on production topic/device registration
