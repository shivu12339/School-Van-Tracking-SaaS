import { PrismaClient, RoleCode } from '@prisma/client';
import { PERMISSIONS, ROLE_PERMISSION_MAP } from './constants';

export async function seedPermissions(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  const permissionMap = new Map<string, string>();
  for (const key of Object.values(PERMISSIONS)) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { name: key },
      create: { key, name: key, description: key },
    });
    permissionMap.set(key, permission.id);
  }
  return permissionMap;
}

export async function ensureRole(
  prisma: PrismaClient,
  schoolId: string | null,
  code: RoleCode,
  permissionMap: Map<string, string>,
): Promise<string> {
  let role = await prisma.role.findFirst({
    where: { schoolId, code, deletedAt: null },
  });
  if (!role) {
    role = await prisma.role.create({
      data: {
        schoolId,
        code,
        name: code.replace('_', ' '),
        isSystem: true,
      },
    });
  }

  for (const key of ROLE_PERMISSION_MAP[code]) {
    const permissionId = permissionMap.get(key);
    if (!permissionId) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId,
        },
      },
      update: {},
      create: { roleId: role.id, permissionId },
    });
  }

  return role.id;
}
