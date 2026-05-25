# Multi-tenant SaaS (Step 5)

## Tenant model

Every school is an isolated tenant. All operational data carries `school_id` with composite indexes for query performance.

| Role | Tenant access |
|------|----------------|
| `SUPER_ADMIN` | All schools; pass `x-school-id` or URL `:id` to scope |
| `SCHOOL_ADMIN` | Own school only |
| `DRIVER` | Own school; assigned trips only (WebSocket validated) |
| `PARENT` | Own school; linked students/trips only |

## Enforcement layers

1. **Prisma middleware** — auto-injects `schoolId` when ALS tenant context is set  
2. **`TenantGuard`** — blocks cross-tenant HTTP params  
3. **`TenantAwareRepository`** — `scopedSchoolId()` on data access  
4. **`SubscriptionGuard`** — plan limits + analytics features (`@RequireSubscription`)  
5. **`WsTenantAccessService`** — trip/parent/driver room validation  

## Schools API

| Method | Path | Role |
|--------|------|------|
| POST | `/api/v1/schools` | Super Admin |
| GET | `/api/v1/schools` | Super Admin (all) / others (own) |
| GET | `/api/v1/schools/plans/catalog` | Authenticated |
| GET | `/api/v1/schools/:id` | Scoped |
| PATCH | `/api/v1/schools/:id` | School Admin+ |
| PATCH | `/api/v1/schools/:id/settings` | School Admin+ |
| PATCH | `/api/v1/schools/:id/status` | Super Admin |
| POST | `/api/v1/schools/:id/subscription` | Super Admin |
| GET | `/api/v1/schools/:id/subscription/status` | Scoped |
| GET | `/api/v1/schools/:id/analytics` | Reports + analytics plan |
| GET | `/api/v1/schools/analytics/platform` | Super Admin |
| POST | `/api/v1/schools/:id/impersonate` | Super Admin |
| DELETE | `/api/v1/schools/:id` | Super Admin (soft delete) |

## Onboarding flow

```
POST /schools
  → Create school (PENDING)
  → school_settings
  → school_subscription (TRIAL + grace)
  → SCHOOL_ADMIN role + user
  → Activate school
```

## Subscription plans

| Tier | Vans | Drivers | Students | Analytics |
|------|------|---------|----------|-----------|
| BASIC | 3 | 5 | 100 | No |
| STANDARD | 10 | 20 | 500 | Yes |
| PREMIUM | 50 | 100 | 5000 | Yes |

**Trial** — `SAAS_DEFAULT_TRIAL_DAYS` (default 14)  
**Grace** — `SAAS_DEFAULT_GRACE_PERIOD_DAYS` after `endsAt` (default 7)

## Redis keys

```
school:{schoolId}:analytics:dashboard
school:{schoolId}:subscription:status
school:{schoolId}:usage:counts
school:{schoolId}:activeTrips
platform:analytics:dashboard
```

Invalidate with `TenantCacheService.invalidateSchool(schoolId)` on school/settings/subscription changes.

## WebSocket rooms

```
school:{schoolId}
trip:{tripId}
parent:{parentId}
driver:{driverId}
admin:{schoolId}
```

Connections validate trip membership before joining trip rooms.

## Environment

```env
SAAS_DEFAULT_TRIAL_DAYS=14
SAAS_DEFAULT_GRACE_PERIOD_DAYS=7
SAAS_ANALYTICS_CACHE_TTL_SECONDS=60
SAAS_PLATFORM_ANALYTICS_CACHE_TTL_SECONDS=120
```

## Module layout

Implementation lives in `services/api/src/schools/` (equivalent to requested `modules/schools/`).
