import { Module } from '@nestjs/common';

/**
 * WebSocket aggregator marker module.
 *
 * Live gateways are registered in domain modules:
 * - `TrackingModule` → namespace `/tracking`
 * - `NotificationsModule` → namespace `/notifications`
 *
 * Redis Socket.IO adapter is wired in `bootstrap.ts`.
 */
@Module({})
export class WebSocketModule {}
