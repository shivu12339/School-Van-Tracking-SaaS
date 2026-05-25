import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SESSION_CACHE_PREFIX } from '../constants/auth.constants';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshTtlMs(): number {
    const ttl = this.configService.get<string>('jwt.refreshTtl', '30d');
    if (ttl.endsWith('d')) {
      return Number(ttl.replace('d', '')) * 24 * 60 * 60 * 1000;
    }
    if (ttl.endsWith('h')) {
      return Number(ttl.replace('h', '')) * 60 * 60 * 1000;
    }
    return 30 * 24 * 60 * 60 * 1000;
  }

  async upsertDeviceSession(input: {
    userId: string;
    schoolId: string | null;
    refreshTokenId: string;
    deviceId: string;
    platform: string;
    appVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());
    const session = await this.prisma.deviceSession.upsert({
      where: {
        userId_deviceId: {
          userId: input.userId,
          deviceId: input.deviceId,
        },
      },
      update: {
        refreshTokenId: input.refreshTokenId,
        platform: input.platform,
        appVersion: input.appVersion,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        status: SessionStatus.ACTIVE,
        lastSeenAt: new Date(),
        expiresAt,
      },
      create: {
        userId: input.userId,
        schoolId: input.schoolId,
        refreshTokenId: input.refreshTokenId,
        deviceId: input.deviceId,
        platform: input.platform,
        appVersion: input.appVersion,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        status: SessionStatus.ACTIVE,
        lastSeenAt: new Date(),
        expiresAt,
      },
    });
    return session.id;
  }

  private getSessionCacheTtl(): number {
    return this.configService.get<number>('auth.sessionCacheTtlSeconds', 900);
  }

  async cacheSession(sessionId: string, user: AuthUser): Promise<void> {
    await this.redisService
      .getClient()
      .setex(
        `${SESSION_CACHE_PREFIX}:${sessionId}`,
        this.getSessionCacheTtl(),
        JSON.stringify(user),
      );
  }

  async getCachedSession(sessionId: string): Promise<AuthUser | null> {
    const raw = await this.redisService.getClient().get(`${SESSION_CACHE_PREFIX}:${sessionId}`);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.deviceSession.updateMany({
      where: { id: sessionId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED },
    });
    await this.redisService.getClient().del(`${SESSION_CACHE_PREFIX}:${sessionId}`);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.prisma.deviceSession.findMany({
      where: { userId, status: SessionStatus.ACTIVE },
      select: { id: true },
    });
    await this.prisma.deviceSession.updateMany({
      where: { userId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED },
    });
    const pipeline = this.redisService.getClient().pipeline();
    for (const session of sessions) {
      pipeline.del(`${SESSION_CACHE_PREFIX}:${session.id}`);
    }
    await pipeline.exec();
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.deviceSession.updateMany({
      where: { id: sessionId, status: SessionStatus.ACTIVE },
      data: { lastSeenAt: new Date() },
    });
  }

  async listActiveSessions(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { userId, status: SessionStatus.ACTIVE },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        appVersion: true,
        ipAddress: true,
        userAgent: true,
        lastSeenAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSessionByDeviceId(userId: string, deviceId: string): Promise<boolean> {
    const session = await this.prisma.deviceSession.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
    });
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return false;
    }
    await this.revokeSession(session.id);
    if (session.refreshTokenId) {
      await this.prisma.refreshToken.updateMany({
        where: { id: session.refreshTokenId, status: SessionStatus.ACTIVE },
        data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
      });
    }
    return true;
  }
}
