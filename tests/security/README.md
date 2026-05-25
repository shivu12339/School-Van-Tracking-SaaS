# Security tests

| Layer | Location |
|-------|----------|
| JWT / guards | `services/api/test/unit/auth/` |
| Tenant HTTP | `services/api/test/unit/tenant.guard.spec.ts` |
| Tenant WS | `services/api/test/unit/ws-tenant-access.service.spec.ts` |
| WebSocket auth | `services/api/test/unit/ws-auth.guard.spec.ts` |
| Injection / XSS | `services/api/test/security/injection.e2e-spec.ts` |

Checklists: [`qa/checklists/OWASP.md`](../../qa/checklists/OWASP.md), [`qa/checklists/PENETRATION.md`](../../qa/checklists/PENETRATION.md)
