# Auth Module (Step 4)

Production authentication + RBAC at `src/auth/` (maps to the requested `modules/auth` layout).

## Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:deviceId`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Full reference: [`docs/AUTH.md`](../../../docs/AUTH.md)

## Structure

```
auth/
├── controllers/     # AuthController
├── services/        # Auth, Token, Session, Permission, LoginProtection
├── repositories/    # AuthRepository
├── strategies/      # JwtStrategy
├── guards/          # JWT, Refresh, Roles, Permissions, Tenant
├── decorators/      # @Public, @Roles, @Permissions, @CurrentUser
├── dto/             # Validated request/response DTOs
├── middleware/      # AuthActivityMiddleware
├── constants/       # Redis keys, permissions
└── utils/           # Token hash, JWT TTL, cookies
```

## Web (Next.js)

- Login with `{ useCookies: true }` for HTTP-only refresh cookie.
- Keep access token in memory only.
- `credentials: 'include'` on refresh requests.

## Mobile (Flutter)

- `deviceId` + `platform` on login.
- Secure storage for refresh token.
- Auto-refresh on `401`.

## Seeded users

- `superadmin@schoolvan.app` / `Admin@12345`
- `admin@demo-school.app` / `Admin@12345` (school `SVT-DEMO-001`)
- `driver@demo-school.app` / `parent@demo-school.app`
