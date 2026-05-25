import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtAccessPayload } from '../../auth/types/jwt-payload.type';
import { AuthUser } from '../../auth/types/auth-user.type';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthUser;
  };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers.authorization?.replace('Bearer ', '') as string | undefined);

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        schoolId: payload.schoolId,
        role: payload.role,
        sessionId: payload.sessionId,
        permissions: payload.permissions,
        firstName: '',
        lastName: null,
        jti: payload.jti,
      };
      return true;
    } catch {
      throw new WsException('Invalid authentication token');
    }
  }

  static assertUser(client: AuthenticatedSocket): AuthUser {
    if (!client.data.user) {
      throw new UnauthorizedException('Unauthenticated socket');
    }
    return client.data.user;
  }
}
