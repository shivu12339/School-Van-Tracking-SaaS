# Authentication & RBAC

Enterprise auth for the School Van Tracking API (`services/api/src/auth/`).

## Architecture

| Layer | Responsibility |
|-------|----------------|
| `AuthController` | HTTP endpoints, cookies, Swagger |
| `AuthService` | Login, refresh, logout, password flows |
| `TokenService` | JWT access + opaque refresh tokens |
| `SessionService` | Device sessions + Redis session cache |
| `PermissionService` | RBAC permission resolution + cache |
| `LoginProtectionService` | Redis rate limit + lockout |
| `AuthRepository` | Prisma data access |
| Guards | JWT, roles, permissions, tenant, refresh |

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/refresh` | Refresh token (body or cookie) |
| POST | `/api/v1/auth/logout` | Bearer |
| POST | `/api/v1/auth/logout-all` | Bearer |
| GET | `/api/v1/auth/me` | Bearer |
| GET | `/api/v1/auth/sessions` | Bearer |
| DELETE | `/api/v1/auth/sessions/:deviceId` | Bearer |
| POST | `/api/v1/auth/sessions/revoke` | Bearer |
| POST | `/api/v1/auth/change-password` | Bearer |
| POST | `/api/v1/auth/forgot-password` | Public |
| POST | `/api/v1/auth/reset-password` | Public |

## Tokens

**Access (JWT)** — short-lived (`JWT_ACCESS_TTL`, default `900s`). Claims: `sub`, `email`, `schoolId`, `role`, `sessionId`, `permissions`, `jti`.

**Refresh (opaque)** — long-lived (`JWT_REFRESH_TTL`, default `30d`). Stored as SHA-256 hash in `refresh_tokens`. Rotation on every `/auth/refresh`. Reuse of a revoked refresh token revokes the entire token family.

## Redis keys

| Key | TTL | Purpose |
|-----|-----|---------|
| `auth:login:attempts:{email}:{ip}` | 15 min | Failed login counter |
| `auth:session:{sessionId}` | 900s | Cached `AuthUser` |
| `auth:permissions:{userId}` | 300s | Permission list cache |
| `auth:blacklist:access:{jti}` | access TTL | Revoked access tokens |

## RBAC

Roles: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `DRIVER`, `PARENT`.

```typescript
@Roles(RoleCode.SCHOOL_ADMIN)
@Permissions(PERMISSIONS.ROUTES_MANAGE)
@TenantScoped()
```

Permission aliases (e.g. `manage_tracking`) map to canonical keys via `resolvePermissionKey()`.

## Multi-tenant

- `TenantGuard` + `TenantMiddleware` enforce `schoolId`.
- `SUPER_ADMIN` may pass `x-school-id` header for cross-tenant ops.
- Prisma tenant middleware scopes queries when ALS has `schoolId`.

## Environment

```env
JWT_ACCESS_SECRET=          # min 32 chars
JWT_REFRESH_SECRET=         # min 32 chars
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=30d
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_LOCK_DURATION_MINUTES=15
AUTH_LOCK_WINDOW_SECONDS=900
AUTH_PASSWORD_RESET_TTL_MINUTES=30
AUTH_SESSION_CACHE_TTL_SECONDS=900
AUTH_PERMISSIONS_CACHE_TTL_SECONDS=300
```

## Clients

**Web:** `useCookies: true` on login → refresh in HTTP-only `svt_refresh` cookie; access token in memory.

**Mobile:** Send `deviceId`, `platform`, `appVersion` on login; store refresh token in secure storage.

## Tests

```bash
cd services/api
pnpm test:unit -- --testPathPattern=test/unit/auth
```
