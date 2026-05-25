import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { SessionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TOKEN_BLACKLIST_PREFIX } from '../constants/auth.constants';
import { generateOpaqueToken, hashToken } from '../utils/token-hash.util';
import { JwtAccessPayload } from '../types/jwt-payload.type';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private getRefreshTtlMs(): number {
    const ttl = this.configService.get<string>('jwt.refreshTtl', '30d');
    if (ttl.endsWith('d')) {
      return Number(ttl.replace('d', '')) * 24 * 60 * 60 * 1000;
    }
    return 30 * 24 * 60 * 60 * 1000;
  }

  async issueAccessToken(user: AuthUser): Promise<string> {
    const payload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      schoolId: user.schoolId,
      role: user.role,
      sessionId: user.sessionId,
      permissions: user.permissions,
      jti: uuidv4(),
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'jwt.accessTtl',
      ) as JwtSignOptions['expiresIn'],
    });
  }

  async issueRefreshToken(input: {
    userId: string;
    schoolId: string | null;
    familyId?: string;
  }): Promise<{ token: string; recordId: string; familyId: string }> {
    const token = generateOpaqueToken();
    const tokenHash = hashToken(token);
    const familyId = input.familyId ?? uuidv4();
    const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());

    const record = await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        schoolId: input.schoolId,
        tokenHash,
        familyId,
        expiresAt,
        status: SessionStatus.ACTIVE,
      },
    });

    return { token, recordId: record.id, familyId };
  }

  async rotateRefreshToken(refreshToken: string): Promise<{
    userId: string;
    schoolId: string | null;
    newRefreshToken: string;
    familyId: string;
    previousTokenId: string;
    newTokenId: string;
  }> {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    if (!existing) {
      const reused = await this.prisma.refreshToken.findFirst({
        where: { tokenHash, status: SessionStatus.REVOKED },
      });
      if (reused) {
        await this.revokeRefreshTokenFamily(reused.familyId);
        throw new UnauthorizedException('Refresh token reuse detected');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
    });

    const rotated = await this.issueRefreshToken({
      userId: existing.userId,
      schoolId: existing.schoolId,
      familyId: existing.familyId,
    });

    return {
      userId: existing.userId,
      schoolId: existing.schoolId,
      newRefreshToken: rotated.token,
      familyId: rotated.familyId,
      previousTokenId: existing.id,
      newTokenId: rotated.recordId,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
    });
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
    });
  }

  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.redisService
      .getClient()
      .setex(`${TOKEN_BLACKLIST_PREFIX}:${jti}`, ttlSeconds, '1');
  }
}
