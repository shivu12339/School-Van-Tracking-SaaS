import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PERMISSIONS_CACHE_PREFIX } from '../constants/auth.constants';
import { ROLE_PERMISSION_MAP, PermissionKey } from '../constants/permissions';

const ROLE_PRIORITY: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SCHOOL_ADMIN,
  RoleCode.DRIVER,
  RoleCode.PARENT,
];

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  resolvePrimaryRole(roles: RoleCode[]): RoleCode {
    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return roles[0] ?? RoleCode.PARENT;
  }

  async getUserRoles(userId: string): Promise<RoleCode[]> {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });
    return assignments.map((assignment) => assignment.role.code);
  }

  async getUserPermissions(userId: string): Promise<PermissionKey[]> {
    const cacheKey = `${PERMISSIONS_CACHE_PREFIX}:${userId}`;
    const cached = await this.redisService.getClient().get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as PermissionKey[];
    }

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const fromDb = assignments.flatMap((assignment) =>
      assignment.role.rolePermissions.map((rp) => rp.permission.key as PermissionKey),
    );

    const roles = assignments.map((a) => a.role.code);
    const fromRoleMap = roles.flatMap((role) => ROLE_PERMISSION_MAP[role] ?? []);

    const permissions = [...new Set([...fromDb, ...fromRoleMap])];
    const ttl = this.configService.get<number>('auth.permissionsCacheTtlSeconds', 300);
    await this.redisService.getClient().setex(cacheKey, ttl, JSON.stringify(permissions));
    return permissions;
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.redisService.getClient().del(`${PERMISSIONS_CACHE_PREFIX}:${userId}`);
  }
}
