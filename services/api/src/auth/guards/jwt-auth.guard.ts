import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TOKEN_BLACKLIST_PREFIX } from '../constants/auth.constants';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) {
      return false;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as AuthUser | undefined;
    if (user?.jti) {
      const blocked = await this.redisService
        .getClient()
        .get(`${TOKEN_BLACKLIST_PREFIX}:${user.jti}`);
      if (blocked) {
        throw new UnauthorizedException('Access token has been revoked');
      }
    }

    return true;
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Invalid or expired access token');
    }
    return user;
  }
}
