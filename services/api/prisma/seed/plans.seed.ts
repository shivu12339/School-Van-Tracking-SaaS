import { PlanTier, PrismaClient } from '@prisma/client';

export async function seedPlanCatalog(
  prisma: PrismaClient,
): Promise<Record<PlanTier, string>> {
  const plans = [
    {
      tier: PlanTier.BASIC,
      name: 'Basic',
      monthlyPrice: 2999,
      maxVans: 3,
      maxDrivers: 5,
      maxStudents: 100,
      trackingLogsPerDay: 5000,
      analyticsEnabled: false,
    },
    {
      tier: PlanTier.STANDARD,
      name: 'Standard',
      monthlyPrice: 5999,
      maxVans: 10,
      maxDrivers: 20,
      maxStudents: 500,
      trackingLogsPerDay: 25000,
      analyticsEnabled: true,
    },
    {
      tier: PlanTier.PREMIUM,
      name: 'Premium',
      monthlyPrice: 12999,
      maxVans: 50,
      maxDrivers: 100,
      maxStudents: 5000,
      trackingLogsPerDay: 100000,
      analyticsEnabled: true,
    },
  ] as const;

  const ids = {} as Record<PlanTier, string>;
  for (const plan of plans) {
    const row = await prisma.planCatalog.upsert({
      where: { tier: plan.tier },
      update: { ...plan },
      create: { ...plan },
    });
    ids[plan.tier] = row.id;
  }
  return ids;
}
