// Monorepo root `.env` lives two levels up from `services/api`
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./load-env.cjs');

import { PrismaClient, RoleCode } from '@prisma/client';
import { seedDemoSchool } from './seed/demo-school.seed';
import { ensureRole, seedPermissions } from './seed/permissions.seed';
import { seedPlanCatalog } from './seed/plans.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const permissionMap = await seedPermissions(prisma);
  const planIds = await seedPlanCatalog(prisma);
  const superAdminRoleId = await ensureRole(
    prisma,
    null,
    RoleCode.SUPER_ADMIN,
    permissionMap,
  );
  await seedDemoSchool(prisma, planIds, permissionMap, superAdminRoleId);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
