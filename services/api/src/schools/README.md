# Schools & Multi-tenant SaaS (Step 5)

See [`docs/MULTI-TENANT.md`](../../../docs/MULTI-TENANT.md) for full reference.

## Structure

```
schools/
├── controllers/schools.controller.ts
├── services/
│   ├── schools.service.ts
│   ├── school-onboarding.service.ts
│   ├── school-settings.service.ts
│   ├── school-analytics.service.ts
│   └── subscription.service.ts
├── repositories/schools.repository.ts
├── guards/subscription.guard.ts
├── dto/
├── validators/
└── types/
```

Shared tenant utilities: `src/common/tenant/`
