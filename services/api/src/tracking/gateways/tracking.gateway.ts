import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { RoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAccessPayload } from '../../auth/types/jwt-payload.type';
import { AuthUser } from '../../auth/types/auth-user.type';
import { WsTenantAccessService } from '../../common/tenant/ws-tenant-access.service';
import { MetricsService } from '../../core/metrics/metrics.service';
import { SOCKET_EVENTS, SOCKET_HEARTBEAT } from '../events/socket.events';
import { TrackingUpdateDto } from '../dto/gps-location.dto';
import { StudentTripActionDto, TripActionDto, SosTriggerDto } from '../dto/trip-action.dto';
import { AuthenticatedSocket, WsAuthGuard } from '../guards/ws-auth.guard';
import { TrackingPubSubService } from '../redis/tracking-pubsub.service';
import { TrackingService } from '../services/tracking.service';
import { TripSessionService } from '../services/trip-session.service';
import { TrackingCacheService } from '../redis/tracking-cache.service';
import { resolveJoinRooms } from '../utils/rooms.util';

@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  pingInterval: 25_000,
  pingTimeout: 60_000,
})
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly trackingService: TrackingService,
    private readonly tripSessionService: TripSessionService,
    private readonly trackingPubSub: TrackingPubSubService,
    private readonly trackingCache: TrackingCacheService,
    private readonly prisma: PrismaService,
    private readonly wsTenantAccess: WsTenantAccessService,
    private readonly metrics: MetricsService,
  ) {}

  afterInit(): void {
    this.logger.log('Tracking gateway initialized (Redis adapter via bootstrap)');
  }

  private async authenticateSocket(client: AuthenticatedSocket): Promise<AuthUser | null> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
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
    const user = await this.authenticateSocket(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    this.metrics.trackSocketConnect();

    const tripId = client.handshake.auth.tripId
      ? String(client.handshake.auth.tripId)
      : undefined;

    let schoolId = user.schoolId ?? undefined;
    if (tripId) {
      const access = await this.wsTenantAccess.assertTripAccess(user, tripId);
      schoolId = access.schoolId;
    } else if (schoolId) {
      this.wsTenantAccess.assertSchoolRoomAccess(user, schoolId);
    }

    let parentId: string | undefined;
    let driverId: string | undefined;

    if (user.role === RoleCode.PARENT && schoolId) {
      const parent = await this.prisma.parent.findFirst({
        where: { userId: user.id, schoolId },
      });
      parentId = parent?.id;
    }
    if (user.role === RoleCode.DRIVER && schoolId) {
      const driver = await this.prisma.driver.findFirst({
        where: { userId: user.id, schoolId },
      });
      driverId = driver?.id;
      if (driver) {
        await this.trackingCache.setDriverOnline(schoolId, driver.id, true);
        this.server
          .to(`admin:${schoolId}`)
          .emit(SOCKET_EVENTS.ADMIN.DRIVER_ONLINE, { driverId: driver.id, online: true });
      }
    }

    if (!schoolId && user.role !== RoleCode.SUPER_ADMIN) {
      client.disconnect(true);
      return;
    }

    const rooms = resolveJoinRooms({
      role: user.role,
      schoolId: schoolId ?? 'global',
      userId: user.id,
      tripId,
      parentId,
      driverId,
    });
    for (const room of rooms) {
      void client.join(room);
    }

    if (tripId) {
      await this.trackingPubSub.subscribeTrip(tripId, (payload) => {
        this.server.to(`trip:${payload.tripId}`).emit(SOCKET_EVENTS.PARENT.VAN_LOCATION, payload);
        this.server.to(`admin:${payload.schoolId}`).emit(SOCKET_EVENTS.ADMIN.VAN_LIVE, payload);
      });
      await this.trackingPubSub.subscribeTripEta(tripId, (eta) => {
        this.server.to(`trip:${tripId}`).emit(SOCKET_EVENTS.PARENT.ETA_UPDATE, eta);
      });

      const snapshot = await this.trackingCache.getReconnectSnapshot(tripId);
      if (snapshot) {
        client.emit(SOCKET_EVENTS.PARENT.VAN_LOCATION, snapshot);
      }
    }
    if (schoolId) {
      await this.trackingPubSub.subscribeSchool(schoolId, (payload) => {
        this.server.to(`school:${payload.schoolId}`).emit(SOCKET_EVENTS.ADMIN.VAN_LIVE, payload);
      });
    }

    client.emit(SOCKET_EVENTS.SERVER.CONNECTED, {
      rooms,
      userId: user.id,
      role: user.role,
      tripId,
      reconnect: true,
    });
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const user = client.data.user;
    if (user?.role === RoleCode.DRIVER && user.schoolId) {
      const driver = await this.prisma.driver.findFirst({ where: { userId: user.id } });
      if (driver) {
        const activeTripId = await this.trackingCache.getDriverActiveTripId(
          user.schoolId,
          driver.id,
        );
        if (!activeTripId) {
          await this.trackingCache.setDriverOnline(user.schoolId, driver.id, false);
          this.server
            .to(`admin:${user.schoolId}`)
            .emit(SOCKET_EVENTS.ADMIN.DRIVER_ONLINE, { driverId: driver.id, online: false });
        }
      }
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_HEARTBEAT.PING)
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
    client.emit(SOCKET_HEARTBEAT.PONG, { ts: Date.now() });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_EVENTS.DRIVER.TRIP_START)
  async onTripStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: TripActionDto,
  ) {
    const user = WsAuthGuard.assertUser(client);
    await this.wsTenantAccess.assertTripAccess(user, body.tripId);
    const trip = await this.tripSessionService.startTrip(user, body.tripId);
    this.server.to(`trip:${body.tripId}`).emit(SOCKET_EVENTS.PARENT.TRIP_STATUS, trip);
    this.server.to(`admin:${trip.schoolId}`).emit(SOCKET_EVENTS.ADMIN.TRIP_STARTED, trip);
    return trip;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_EVENTS.DRIVER.TRIP_STOP)
  async onTripStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: TripActionDto,
  ) {
    const user = WsAuthGuard.assertUser(client);
    await this.wsTenantAccess.assertTripAccess(user, body.tripId);
    const trip = await this.tripSessionService.stopTrip(user, body.tripId);
    this.server.to(`trip:${body.tripId}`).emit(SOCKET_EVENTS.PARENT.TRIP_STATUS, trip);
    this.server.to(`admin:${trip.schoolId}`).emit(SOCKET_EVENTS.ADMIN.TRIP_STOPPED, trip);
    return trip;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_EVENTS.DRIVER.TRACKING_UPDATE)
  async onTrackingUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: TrackingUpdateDto,
  ) {
    const user = WsAuthGuard.assertUser(client);
    await this.wsTenantAccess.assertTripAccess(user, body.tripId);
    const payload = await this.trackingService.processDriverLocation(user, body);
    this.server.to(`trip:${payload.tripId}`).emit(SOCKET_EVENTS.PARENT.VAN_LOCATION, payload);
    this.server.to(`admin:${payload.schoolId}`).emit(SOCKET_EVENTS.ADMIN.VAN_LIVE, payload);
    return payload;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_EVENTS.DRIVER.STUDENT_PICKED)
  async onStudentPicked(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: StudentTripActionDto,
  ) {
    const user = WsAuthGuard.assertUser(client);
    await this.wsTenantAccess.assertTripAccess(user, body.tripId);
    const updated = await this.trackingService.markStudentPicked(
      user,
      body.tripId,
      body.studentId,
    );
    this.server.to(`trip:${body.tripId}`).emit(SOCKET_EVENTS.PARENT.STUDENT_PICKED, updated);
    return updated;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_EVENTS.DRIVER.STUDENT_DROPPED)
  async onStudentDropped(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: StudentTripActionDto,
  ) {
    const user = WsAuthGuard.assertUser(client);
    await this.wsTenantAccess.assertTripAccess(user, body.tripId);
    const updated = await this.trackingService.markStudentDropped(
      user,
      body.tripId,
      body.studentId,
    );
    this.server.to(`trip:${body.tripId}`).emit(SOCKET_EVENTS.PARENT.STUDENT_DROPPED, updated);
    return updated;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(SOCKET_EVENTS.DRIVER.SOS_TRIGGERED)
  async onSos(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: SosTriggerDto,
  ) {
    const user = WsAuthGuard.assertUser(client);
    await this.wsTenantAccess.assertTripAccess(user, body.tripId);
    const alert = await this.trackingService.triggerSos(user, body.tripId, body);
    this.server.to(`admin:${alert.schoolId}`).emit(SOCKET_EVENTS.ADMIN.SOS_ALERT, alert);
    return alert;
  }
}
