# Packages

| Package | Purpose |
|---------|---------|
| `@schoolvan/config` | Shared ESLint, TypeScript, Prettier configs |
| `@schoolvan/shared` | Cross-app constants, types, API contracts |

Import in API/web:

```typescript
import { ROLES, SOCKET_EVENTS } from '@schoolvan/shared';
```

Build order: `shared` must build before `api` and `web` (`turbo run build` handles this).
