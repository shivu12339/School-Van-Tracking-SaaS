# OWASP Checklist (API + Web + Mobile)

## A01 Broken Access Control

- [ ] RBAC guards on all non-public routes
- [ ] Tenant guard prevents cross-school access
- [ ] WebSocket rooms scoped by trip/school

## A02 Cryptographic Failures

- [ ] TLS everywhere
- [ ] Argon2/bcrypt password hashing
- [ ] JWT secrets in vault

## A03 Injection

- [ ] Prisma only (no raw SQL except controlled PostGIS)
- [ ] Parameterized geofence queries

## A04 Insecure Design

- [ ] Rate limiting on auth
- [ ] Geofence dedup cooldowns
- [ ] Multi-tenant by design

## A05 Security Misconfiguration

- [ ] Swagger disabled in production (optional)
- [ ] Default accounts removed after seed
- [ ] Debug off in prod

## A07 Authentication Failures

- [ ] Refresh token rotation
- [ ] Session invalidation on logout
- [ ] Account lockout

## A09 Logging & Monitoring

- [ ] Audit log for admin actions
- [ ] Sentry for exceptions

## A10 SSRF

- [ ] API proxy whitelist (Next.js backend routes only to known API URL)
