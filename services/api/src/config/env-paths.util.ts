import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Resolve `.env` files for local runs. Uses `process.cwd()` so paths stay correct whether
 * the process runs from `services/api`, the monorepo root, or compiled `dist` output.
 */
export function resolveEnvFilePaths(): string[] {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, '.env.production'),
    join(cwd, '.env'),
    join(cwd, '..', '.env.production'),
    join(cwd, '..', '.env'),
    join(cwd, '..', '..', '.env.production'),
    join(cwd, '..', '..', '.env'),
  ];
  return [...new Set(candidates.filter((p) => existsSync(p)))];
}
