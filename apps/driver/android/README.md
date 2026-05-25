# Android platform setup

Run once from `apps/driver`:

```bash
flutter create . --platforms=android
```

Then merge permissions from `app/src/main/AndroidManifest.xml` in this folder if `flutter create` overwrote them.

Set Maps key in `android/local.properties` or `--dart-define=GOOGLE_MAPS_KEY=...`.

Place `google-services.json` under `android/app/` for Firebase.
