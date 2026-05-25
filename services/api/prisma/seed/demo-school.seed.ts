import {
  BillingStatus,
  PlanTier,
  PrismaClient,
  RoleCode,
  SchoolOperationalStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_SEED_PASSWORD } from './constants';
import { ensureRole } from './permissions.seed';

export async function seedDemoSchool(
  prisma: PrismaClient,
  planIds: Record<PlanTier, string>,
  permissionMap: Map<string, string>,
  superAdminRoleId: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 12);

  const school = await prisma.school.upsert({
    where: { code: 'SVT-DEMO-001' },
    update: { status: SchoolOperationalStatus.ACTIVE, isActive: true },
    create: {
      name: 'Demo School',
      code: 'SVT-DEMO-001',
      status: SchoolOperationalStatus.ACTIVE,
      isActive: true,
    },
  });

  await prisma.schoolSettings.upsert({
    where: { schoolId: school.id },
    update: {},
    create: { schoolId: school.id },
  });

  await prisma.schoolSubscription.upsert({
    where: { schoolId: school.id },
    update: {
      planCatalogId: planIds.STANDARD,
      billingStatus: BillingStatus.ACTIVE,
    },
    create: {
      schoolId: school.id,
      planCatalogId: planIds.STANDARD,
      billingStatus: BillingStatus.ACTIVE,
      startsAt: new Date(),
    },
  });

  const schoolAdminRoleId = await ensureRole(
    prisma,
    school.id,
    RoleCode.SCHOOL_ADMIN,
    permissionMap,
  );
  const driverRoleId = await ensureRole(prisma, school.id, RoleCode.DRIVER, permissionMap);
  const parentRoleId = await ensureRole(prisma, school.id, RoleCode.PARENT, permissionMap);

  await ensureUser(prisma, {
    schoolId: null,
    email: 'superadmin@schoolvan.app',
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    roleId: superAdminRoleId,
  });

  await ensureUser(prisma, {
    schoolId: school.id,
    email: 'admin@demo-school.app',
    passwordHash,
    firstName: 'School',
    lastName: 'Admin',
    roleId: schoolAdminRoleId,
  });

  const driverUser = await prisma.user.upsert({
    where: { schoolId_email: { schoolId: school.id, email: 'driver@demo-school.app' } },
    update: { isActive: true },
    create: {
      schoolId: school.id,
      email: 'driver@demo-school.app',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Driver',
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: driverUser.id, roleId: driverRoleId } },
    update: {},
    create: { userId: driverUser.id, roleId: driverRoleId, schoolId: school.id },
  });
  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    create: {
      schoolId: school.id,
      userId: driverUser.id,
      licenseNumber: 'DL-DEMO-001',
      isAvailable: true,
    },
    update: {},
  });

  const parentUser = await prisma.user.upsert({
    where: { schoolId_email: { schoolId: school.id, email: 'parent@demo-school.app' } },
    update: { isActive: true },
    create: {
      schoolId: school.id,
      email: 'parent@demo-school.app',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Parent',
      phone: '+919999999999',
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: parentUser.id, roleId: parentRoleId } },
    update: {},
    create: { userId: parentUser.id, roleId: parentRoleId, schoolId: school.id },
  });
  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { schoolId: school.id, userId: parentUser.id, relationship: 'Father' },
  });

  const van = await prisma.van.upsert({
    where: { schoolId_registrationNo: { schoolId: school.id, registrationNo: 'KA01AB1234' } },
    update: {},
    create: {
      schoolId: school.id,
      registrationNo: 'KA01AB1234',
      label: 'Van 1',
      capacity: 30,
      isActive: true,
    },
  });

  const route = await prisma.route.upsert({
    where: { schoolId_routeCode: { schoolId: school.id, routeCode: 'RTE-001' } },
    update: {},
    create: {
      schoolId: school.id,
      vanId: van.id,
      routeCode: 'RTE-001',
      routeName: 'Morning Pickup A',
      direction: 'PICKUP',
      isActive: true,
    },
  });

  const student = await prisma.student.upsert({
    where: { schoolId_admissionNumber: { schoolId: school.id, admissionNumber: 'STU-001' } },
    update: {},
    create: {
      schoolId: school.id,
      parentId: parent.id,
      routeId: route.id,
      admissionNumber: 'STU-001',
      fullName: 'Aarav Sharma',
      grade: '5',
      section: 'A',
      homeLatitude: 12.9352,
      homeLongitude: 77.6245,
    },
  });

  const driver = await prisma.driver.findUniqueOrThrow({ where: { userId: driverUser.id } });
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  let trip = await prisma.trip.findFirst({
    where: { schoolId: school.id, routeId: route.id, tripDate: { gte: today, lte: dayEnd } },
  });
  if (!trip) {
    trip = await prisma.trip.create({
      data: {
        schoolId: school.id,
        routeId: route.id,
        vanId: van.id,
        driverId: driver.id,
        tripDate: today,
        direction: 'PICKUP',
        status: 'SCHEDULED',
      },
    });
  }

  await prisma.tripStudent.upsert({
    where: { tripId_studentId: { tripId: trip.id, studentId: student.id } },
    update: {},
    create: {
      schoolId: school.id,
      tripId: trip.id,
      studentId: student.id,
      status: 'PENDING',
    },
  });
}

async function ensureUser(
  prisma: PrismaClient,
  input: {
    schoolId: string | null;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string;
    roleId: string;
  },
): Promise<void> {
  let user = await prisma.user.findFirst({
    where: { email: input.email, schoolId: input.schoolId },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        schoolId: input.schoolId,
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        isActive: true,
      },
    });
  }

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: user.id, roleId: input.roleId } },
    update: {},
    create: {
      userId: user.id,
      roleId: input.roleId,
      schoolId: input.schoolId,
    },
  });
}
