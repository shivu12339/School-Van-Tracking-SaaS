import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import Redis from 'ioredis';
import { TRACKING_CHANNELS } from '../events/socket.events';
import { EtaPayload, VanLocationBroadcast } from '../interfaces/tracking-payload.interface';

type LocationHandler = (payload: VanLocationBroadcast) => void;
type EtaHandler = (payload: EtaPayload) => void;

@Injectable()
export class TrackingPubSubService implements OnModuleInit, OnModuleDestroy {
  private subscriber!: Redis;
  private readonly handlers = new Map<string, Set<LocationHandler>>();
  private readonly etaHandlers = new Map<string, Set<EtaHandler>>();

  constructor(private readonly redisService: RedisService) {}

  onModuleInit(): void {
    this.subscriber = this.redisService.getClient().duplicate();
    this.subscriber.on('message', (channel, message) => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers?.size) {
        const payload = JSON.parse(message) as VanLocationBroadcast;
        channelHandlers.forEach((handler) => handler(payload));
        return;
      }
      const etaChannelHandlers = this.etaHandlers.get(channel);
      if (etaChannelHandlers?.size) {
        const payload = JSON.parse(message) as EtaPayload;
        etaChannelHandlers.forEach((handler: EtaHandler) => handler(payload));
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber.quit();
  }

  async publishTripLocation(payload: VanLocationBroadcast): Promise<void> {
    const channel = TRACKING_CHANNELS.tripBroadcast(payload.tripId);
    await this.redisService.getClient().publish(channel, JSON.stringify(payload));
    await this.redisService
      .getClient()
      .publish(TRACKING_CHANNELS.schoolBroadcast(payload.schoolId), JSON.stringify(payload));
  }

  async subscribeTrip(tripId: string, handler: LocationHandler): Promise<void> {
    const channel = TRACKING_CHANNELS.tripBroadcast(tripId);
    await this.registerHandler(channel, handler);
  }

  async subscribeSchool(schoolId: string, handler: LocationHandler): Promise<void> {
    const channel = TRACKING_CHANNELS.schoolBroadcast(schoolId);
    await this.registerHandler(channel, handler);
  }

  async publishEtaUpdate(schoolId: string, payload: EtaPayload): Promise<void> {
    const channel = TRACKING_CHANNELS.etaBroadcast(payload.tripId);
    await this.redisService.getClient().publish(channel, JSON.stringify(payload));
    await this.redisService
      .getClient()
      .publish(TRACKING_CHANNELS.schoolEtaBroadcast(schoolId), JSON.stringify(payload));
  }

  async subscribeTripEta(tripId: string, handler: EtaHandler): Promise<void> {
    const channel = TRACKING_CHANNELS.etaBroadcast(tripId);
    await this.registerEtaHandler(channel, handler);
  }

  private async registerEtaHandler(channel: string, handler: EtaHandler): Promise<void> {
    if (!this.etaHandlers.has(channel)) {
      this.etaHandlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    this.etaHandlers.get(channel)!.add(handler);
  }

  private async registerHandler(channel: string, handler: LocationHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    this.handlers.get(channel)!.add(handler);
  }
}
