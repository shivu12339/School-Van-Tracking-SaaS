# Final QA Checklist

## Auth

- [ ] Login (school admin, super admin, driver, parent)
- [ ] Logout clears session
- [ ] Token refresh before expiry
- [ ] Account lockout after failed attempts
- [ ] Password reset flow (if enabled)

## Tracking

- [ ] Driver GPS streams every ~4s on active trip
- [ ] Parent sees live van marker + ETA
- [ ] Route playback for completed trip
- [ ] Trip status transitions (scheduled → in progress → completed)

## Notifications

- [ ] 1 KM geofence alert (once per cooldown)
- [ ] 500m geofence alert
- [ ] No duplicate alerts within cooldown
- [ ] Student picked / dropped push
- [ ] School announcement broadcast

## Admin

- [ ] School CRUD (super admin)
- [ ] Fleet views load (or graceful empty state)
- [ ] Live map shows active trips
- [ ] Notification analytics page

## Multi-tenant

- [ ] School A admin cannot access School B data
- [ ] Parent only sees own children
- [ ] Driver only sees assigned school trips

## Realtime

- [ ] Socket reconnect after network toggle
- [ ] Multiple parents on same trip receive updates
- [ ] Worker processes geofence queue under load

## Regression

- [ ] CI green on `main`
- [ ] `pnpm test` API unit+integration
- [ ] Playwright smoke passed
- [ ] Flutter widget tests passed
