import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EmergencySeverity, RoleCode, TripStudentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { GpsLocationDto, OfflineSyncDto, TrackingUpdateDto } from '../dto/gps-location.dto';
import { VanLocationBroadcast } from '../interfaces/tracking-payload.interface';
import { TrackingCacheService } from '../redis/tracking-cache.service';
import { TrackingPubSubService } from '../redis/tracking-pubsub.service';
import { TrackingBatchService } from './tracking-batch.service';
import { TripSessionService } from './trip-session.service';
import { GeofenceService } from './geofence.service';
import { EtaService } from './eta.service';
import { TrackingNotificationService } from '../../notifications/services/tracking-notification.service';
import { GpsIntegrityService } from './gps-integrity.service';
import { TrackingQueueService } from '../queues/tracking-queue.service';
import { EtaPayload } from '../interfaces/tracking-payload.interface';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly minGpsIntervalMs = 3000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly tripSessionService: TripSessionService,
    private readonly trackingCache: TrackingCacheService,
    private readonly trackingPubSub: TrackingPubSubService,
    private readonly trackingBatch: TrackingBatchService,
    private readonly geofenceService: GeofenceService,
    private readonly etaService: EtaService,
    private readonly trackingNotifications: TrackingNotificationService,
    private readonly gpsIntegrity: GpsIntegrityService,
    private readonly trackingQueue: TrackingQueueService,
  ) {}

  async processDriverLocation(user: AuthUser, dto: TrackingUpdateDto): Promise<VanLocationBroadcast> {
    const trip = await this.tripSessionService.assertActiveDriverTrip(user, dto.tripId);
    await this.gpsIntegrity.assertValid(dto.tripId, dto);
    if (await this.trackingCache.shouldThrottle(dto.tripId, this.minGpsIntervalMs)) {
      const cached = await this.trackingCache.getTripLocation(trip.schoolId, dto.tripId);
      if (cached) return cached;
    }

    const payload: VanLocationBroadcast = {
      tripId: trip.id,
      schoolId: trip.schoolId,
      vanId: trip.vanId,
      driverId: trip.driverId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      timestamp: dto.timestamp,
    };

    await this.trackingCache.setLastKnownPosition(trip.schoolId, trip.id, payload);
    await this.trackingPubSub.publishTripLocation(payload);
    void this.trackingQueue.enqueueAnalytics({
      schoolId: trip.schoolId,
      tripId: trip.id,
      event: 'location',
    });
    this.trackingBatch.enqueue({
      schoolId: trip.schoolId,
      tripId: trip.id,
      vanId: trip.vanId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      timestamp: dto.timestamp,
    });

    void this.runGeofenceAndEta(trip.schoolId, trip.id, dto);
    return payload;
  }

  private async runGeofenceAndEta(
    schoolId: string,
    tripId: string,
    location: GpsLocationDto,
  ): Promise<void> {
    try {
      const settings = await this.prisma.schoolSettings.findUnique({ where: { schoolId } });
      await this.geofenceService.evaluateTripProximity({
        schoolId,
        tripId,
        latitude: location.latitude,
        longitude: location.longitude,
        radius1Km: settings?.pickupRadius1Km ?? 1000,
        radius500m: settings?.pickupRadius500m ?? 500,
      });

      const pendingStudents = await this.prisma.tripStudent.findMany({
        where: { tripId, status: TripStudentStatus.PENDING },
        include: { student: true },
      });
      for (const ts of pendingStudents) {
        if (!ts.student.homeLatitude || !ts.student.homeLongitude) continue;
        const eta = this.etaService.calculateEtaMinutes(
          location.latitude,
          location.longitude,
          Number(ts.student.homeLatitude),
          Number(ts.student.homeLongitude),
        );
        const etaPayload: EtaPayload = {
          tripId,
          studentId: ts.studentId,
          etaMinutes: eta.etaMinutes,
          distanceMeters: eta.distanceMeters,
          updatedAt: new Date().toISOString(),
        };
        await this.etaService.cacheEta(etaPayload);
        await this.trackingPubSub.publishEtaUpdate(schoolId, etaPayload);
        if (eta.etaMinutes >= 15) {
          void this.trackingNotifications.onTripDelayed(
            schoolId,
            tripId,
            ts.studentId,
            eta.etaMinutes,
          );
        }
      }
    } catch (error) {
      this.logger.warn(`Geofence/ETA processing failed trip=${tripId}`, error as Error);
    }
  }

  async syncOfflineBatch(user: AuthUser, dto: OfflineSyncDto): Promise<{ accepted: number }> {
    await this.tripSessionService.assertActiveDriverTrip(user, dto.tripId);
    const trip = await this.prisma.trip.findUniqueOrThrow({ where: { id: dto.tripId } });
    const sorted = [...dto.points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    for (const point of sorted) {
      this.trackingBatch.enqueue({
        schoolId: trip.schoolId,
        tripId: trip.id,
        vanId: trip.vanId,
        ...point,
      });
    }
    if (sorted.length > 0) {
      await this.processDriverLocation(
        user,
        { tripId: dto.tripId, ...sorted[sorted.length - 1]! } as TrackingUpdateDto,
      );
    }
    return { accepted: sorted.length };
  }

  async getLiveLocation(user: AuthUser, tripId: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    if (user.role === RoleCode.PARENT) {
      const parent = await this.prisma.parent.findFirst({ where: { userId: user.id } });
      const linked = await this.prisma.tripStudent.findFirst({
        where: { tripId, student: { parentId: parent?.id } },
      });
      if (!linked) throw new ForbiddenException('Trip access denied');
    }
    return this.trackingCache.getTripLocation(schoolId, tripId);
  }

  async getPlayback(user: AuthUser, tripId: string, from?: string, to?: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    return this.prisma.trackingLog.findMany({
      where: {
        schoolId,
        tripId,
        ...(from || to
          ? {
              eventTimestamp: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { eventTimestamp: 'asc' },
      take: 5000,
      select: {
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        accuracy: true,
        eventTimestamp: true,
      },
    });
  }

  async markStudentPicked(user: AuthUser, tripId: string, studentId: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const updated = await this.prisma.tripStudent.update({
      where: { tripId_studentId: { tripId, studentId } },
      data: { status: TripStudentStatus.PICKED, pickupAt: new Date() },
    });
    void this.trackingNotifications.onStudentPicked(schoolId, tripId, studentId);
    return updated;
  }

  async markStudentDropped(user: AuthUser, tripId: string, studentId: string) {
    const schoolId = this.tenantContext.resolveSchoolId(user);
    const updated = await this.prisma.tripStudent.update({
      where: { tripId_studentId: { tripId, studentId } },
      data: { status: TripStudentStatus.DROPPED, dropAt: new Date() },
    });
    void this.trackingNotifications.onStudentDropped(schoolId, tripId, studentId);
    return updated;
  }

  async triggerSos(
    user: AuthUser,
    tripId: string,
    input: { latitude?: number; longitude?: number; description?: string },
  ) {
    const trip = await this.tripSessionService.assertActiveDriverTrip(user, tripId);
    const alert = await this.prisma.emergencyAlert.create({
      data: {
        schoolId: trip.schoolId,
        tripId,
        triggeredById: user.id,
        severity: EmergencySeverity.CRITICAL,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });
    void this.trackingNotifications.onSosTriggered(
      trip.schoolId,
      tripId,
      input.description,
    );
    return alert;
  }
}
