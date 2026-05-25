import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../utils/token-hash.util';

export interface RefreshTokenContext {
  userId: string;
  schoolId: string | null;
  refreshTokenId: string;
  familyId: string;
  rawToken: string;
}

@Injectable()
export class RefreshTokenValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(rawToken: string): Promise<RefreshTokenContext> {
    if (!rawToken?.trim()) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      await this.handlePossibleReuse(tokenHash);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      userId: record.userId,
      schoolId: record.schoolId,
      refreshTokenId: record.id,
      familyId: record.familyId,
      rawToken,
    };
  }

  private async handlePossibleReuse(tokenHash: string): Promise<void> {
    const reused = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, status: SessionStatus.REVOKED },
    });
    if (!reused) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { familyId: reused.familyId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
    });
    throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked');
  }
}
