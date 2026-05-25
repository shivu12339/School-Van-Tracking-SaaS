import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { JwtAccessPayload } from '../../auth/types/jwt-payload.type';
import { AuthUser } from '../../auth/types/auth-user.type';
import { NOTIFICATION_SOCKET_EVENTS } from '../events/notification.events';

interface AuthenticatedSocket {
  handshake: { auth?: { token?: string }; headers: { authorization?: string } };
  data: { user?: AuthUser };
  join: (room: string) => void;
  disconnect: (close?: boolean) => void;
  emit: (event: string, payload: unknown) => void;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    this.logger.log('Notification gateway initialized');
  }

  private async authenticate(client: AuthenticatedSocket): Promise<AuthUser | null> {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });
      return {
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
    } catch {
      return null;
    }
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const user = await this.authenticate(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    client.join(`user:${user.id}`);
    if (user.schoolId) {
      client.join(`school:${user.schoolId}`);
    }
    client.emit(NOTIFICATION_SOCKET_EVENTS.SERVER.CONNECTED, { userId: user.id });
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
