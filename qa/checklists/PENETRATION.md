# Penetration Testing Checklist

Execute against **staging** only.

## Authentication

- [ ] Brute force login (expect 429/lockout)
- [ ] JWT alg none attack
- [ ] Refresh token reuse after logout

## Authorization

- [ ] Horizontal privilege: access other school trip by ID
- [ ] Vertical privilege: parent → admin endpoints
- [ ] IDOR on student/trip UUIDs

## WebSocket

- [ ] Connect without token
- [ ] Subscribe to another school's trip room
- [ ] Flood events (expect disconnect/rate limit)

## API abuse

- [ ] Oversized JSON body
- [ ] SQLi in query params (should fail safely)
- [ ] Mass assignment on PATCH endpoints

## Web

- [ ] XSS in reflected inputs
- [ ] CSRF on state-changing routes (cookie model)
- [ ] Open redirect on login `redirect` param

## Mobile

- [ ] Token extraction from backup
- [ ] MITM with pinning disabled (dev build only)

**Report template:** finding, severity, reproduction, remediation, retest date.
