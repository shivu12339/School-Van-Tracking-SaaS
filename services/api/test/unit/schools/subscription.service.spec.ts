import { BillingStatus, PlanTier } from '@prisma/client';
import { SubscriptionService } from '../../../src/schools/services/subscription.service';

describe('SubscriptionService.getSubscriptionStatus', () => {
  const prisma = {
    school: { findFirst: jest.fn() },
    van: { count: jest.fn() },
    driver: { count: jest.fn() },
    student: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const tenantCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    invalidateSchool: jest.fn(),
  };
  const configService = { get: jest.fn().mockReturnValue(7) };

  let service: SubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([2, 3, 10]);
    service = new SubscriptionService(
      prisma as never,
      tenantCache as never,
      configService as never,
    );
  });

  it('denies access when subscription cancelled', async () => {
    prisma.school.findFirst.mockResolvedValue({
      id: 'school-1',
      isActive: true,
      status: 'ACTIVE',
      subscription: {
        billingStatus: BillingStatus.CANCELLED,
        trialEndsAt: null,
        endsAt: null,
        graceEndsAt: null,
        planCatalog: {
          tier: PlanTier.BASIC,
          maxVans: 3,
          maxDrivers: 5,
          maxStudents: 100,
          trackingLogsPerDay: 5000,
          analyticsEnabled: false,
        },
      },
    });

    const status = await service.getSubscriptionStatus('school-1');
    expect(status.canAccessPlatform).toBe(false);
    expect(status.message).toContain('cancelled');
  });

  it('allows access during grace period after expiry', async () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);
    prisma.school.findFirst.mockResolvedValue({
      id: 'school-1',
      isActive: true,
      status: 'ACTIVE',
      subscription: {
        billingStatus: BillingStatus.ACTIVE,
        trialEndsAt: null,
        endsAt: past,
        graceEndsAt: future,
        planCatalog: {
          tier: PlanTier.STANDARD,
          maxVans: 10,
          maxDrivers: 20,
          maxStudents: 500,
          trackingLogsPerDay: 25000,
          analyticsEnabled: true,
        },
      },
    });

    const status = await service.getSubscriptionStatus('school-1');
    expect(status.canAccessPlatform).toBe(true);
    expect(status.inGracePeriod).toBe(true);
  });
});
