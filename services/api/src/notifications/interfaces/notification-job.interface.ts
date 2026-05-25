import { type NotificationType } from '@prisma/client';

export interface DispatchNotificationJob {
  notificationId: string;
}

export interface GeofenceJob {
  schoolId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  radius1Km: number;
  radius500m: number;
}

export interface BroadcastNotificationJob {
  schoolId: string;
  type?: NotificationType;
  title: string;
  body: string;
  userIds: string[];
  deepLink?: string;
  locale?: string;
  actorUserId?: string;
}
