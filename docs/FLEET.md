# Fleet operations (Step 6)

Operational modules for school fleet management at `services/api/src/{drivers,vans,students,parents,routes}/`.

Shared infrastructure: `services/api/src/fleet/`

## Modules

| Module | Base path | Permissions |
|--------|-----------|-------------|
| Drivers | `/api/v1/drivers` | `drivers.create`, `drivers.manage` |
| Vans | `/api/v1/vans` | `vans.manage` |
| Students | `/api/v1/students` | `students.create`, `students.manage` |
| Parents | `/api/v1/parents` | `parents.manage` |
| Routes | `/api/v1/routes` | `routes.manage` |

## Assignment service

`FleetAssignmentService` centralizes:

- Van → Route (DB `routes.van_id`, capacity check)
- Student → Route (`students.route_id`)
- Parent → Student (`students.parent_id`)
- Driver → Van (Redis `school:{id}:driver:{driverId}:van`)

## Security

- `@TenantScoped()` on all fleet controllers
- `TenantAwareRepository.scopedSchoolId()` on queries
- `@RequireSubscription({ checkLimits: 'vans' | 'drivers' | 'students' })` on creates
- Audit logs on create/update/delete

## Geolocation

Lat/lng validated on students (home) and route stops. PostGIS triggers sync geography columns on write.

## Redis cache

- Route detail: `school:{schoolId}:route:{routeId}:detail`
- Driver-van assignment keys (see `fleet/constants/fleet-redis.keys.ts`)

## Bulk import

`POST /api/v1/students/bulk` — up to 500 students per request with per-row error reporting.

## Trip foundations

Routes include stops (ordered), van assignment, and student linkage — ready for trip scheduling in the Trips module.
