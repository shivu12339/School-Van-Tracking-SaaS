# Security Testing Strategy

## Automated

| Area | Test |
|------|------|
| JWT | Expired, tampered, wrong audience — 401 |
| RBAC | Parent hitting admin routes — 403 |
| Tenant | Cross-school ID in URL — 403 |
| Rate limit | Login brute force — 429 |
| WebSocket | Missing/invalid token — disconnect |
| Input validation | class-validator on DTOs — 400 |

## OWASP ASVS alignment

See [`checklists/OWASP.md`](../checklists/OWASP.md).

## Penetration testing

See [`checklists/PENETRATION.md`](../checklists/PENETRATION.md) — run before production launch and annually.

## Tools (staging)

- OWASP ZAP baseline scan on Vercel preview + Railway API
- `sqlmap` — negative test on parameterized endpoints only
- Socket fuzzing — invalid event payloads

## Prevent

- Secret leakage in client bundles (audit `NEXT_PUBLIC_*`)
- CORS `*` in production
- Open metrics endpoint — restrict by IP/VPN
