# API test suite

## Layout

| Path | Type |
|------|------|
| `unit/` | Jest unit tests (guards, services, validators) |
| `integration/` | Supertest HTTP e2e |
| `security/` | JWT tamper, injection, rate limit |
| `deployment/` | Health probes |
| `mocks/` | Prisma + Redis mocks |
| `helpers/` | `createTestApp`, mock GPS events |
| `prisma/` | Test DB utilities |

## Commands

```bash
pnpm test              # All *.spec.ts (unit)
pnpm test:unit         # unit/ only
pnpm test:integration  # integration/ only
pnpm test:e2e          # *.e2e-spec.ts + security/
pnpm test:cov          # Coverage report
```

## Env

Configured in `setup.ts` — do not rely on `.env` for CI.
