import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { SessionStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TOKEN_BLACKLIST_PREFIX } from '../constants/auth.constants';
import { JwtAccessPayload } from '../types/jwt-payload.type';
import { AuthUser } from '../types/auth-user.type';
import { PermissionService } from '../services/permission.service';
import { SessionService } from '../services/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly sessionService: SessionService,
    private readonly permissionService: PermissionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    if (payload.jti) {
      const blocked = await this.redisService
        .getClient()
        .get(`${TOKEN_BLACKLIST_PREFIX}:${payload.jti}`);
      if (blocked) {
        throw new UnauthorizedException('Access token has been revoked');
      }
    }

    const cached = await this.sessionService.getCachedSession(payload.sessionId);
    if (cached) {
      return { ...cached, jti: payload.jti };
    }

    const session = await this.prisma.deviceSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roleCodes = user.userRoles.map((ur) => ur.role.code);
    const role = this.permissionService.resolvePrimaryRole(roleCodes);
    const permissions = await this.permissionService.getUserPermissions(user.id);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      schoolId: user.schoolId,
      role,
      sessionId: payload.sessionId,
      permissions,
      firstName: user.firstName,
      lastName: user.lastName,
      jti: payload.jti,
    };

    await this.sessionService.cacheSession(payload.sessionId, authUser);
    return authUser;
  }
}
