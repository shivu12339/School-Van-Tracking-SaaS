import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import path from 'node:path';

const API_ROOT = path.resolve(__dirname, '../..');

/**
 * Apply migrations to the database pointed at by DATABASE_URL.
 * Use a dedicated test database — never run against production.
 */
export function migrateTestDatabase(): void {
  execSync('npx prisma migrate deploy', {
    cwd: API_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
}

export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
}

/**
 * Truncate tenant data between integration tests (preserves plan_catalog / permissions).
 */
export async function resetTenantData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      tracking_logs,
      tracking_logs_archive,
      trip_students,
      trips,
      notifications,
      emergency_alerts,
      route_stops,
      routes,
      students,
      parents,
      drivers,
      vans,
      refresh_tokens,
      device_sessions,
      audit_logs,
      user_roles,
      users,
      role_permissions,
      roles,
      subscription_plans,
      school_subscriptions,
      school_settings,
      schools
    RESTART IDENTITY CASCADE
  `;
}
