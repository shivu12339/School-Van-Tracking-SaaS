import { FleetAssignmentService } from '../../../src/fleet/services/fleet-assignment.service';

describe('FleetAssignmentService', () => {
  const prisma = {
    route: { findFirst: jest.fn(), update: jest.fn() },
    van: { findFirst: jest.fn(), findUnique: jest.fn() },
    student: { findFirst: jest.fn(), count: jest.fn(), update: jest.fn() },
    parent: { findFirst: jest.fn() },
    driver: { findFirst: jest.fn() },
    trip: { findFirst: jest.fn() },
  };
  const fleetCache = {
    invalidateRoute: jest.fn(),
    setDriverVanAssignment: jest.fn(),
    getDriverVanAssignment: jest.fn(),
  };

  let service: FleetAssignmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FleetAssignmentService(prisma as never, fleetCache as never);
  });

  it('rejects van assignment when student count exceeds capacity', async () => {
    prisma.route.findFirst.mockResolvedValue({ id: 'r1', schoolId: 's1', isActive: true });
    prisma.van.findFirst.mockResolvedValue({ id: 'v1', schoolId: 's1', isActive: true, capacity: 2 });
    prisma.student.count.mockResolvedValue(5);

    await expect(service.assignVanToRoute('s1', 'r1', 'v1')).rejects.toThrow(
      /van capacity is 2/i,
    );
  });
});
