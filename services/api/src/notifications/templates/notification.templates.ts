import { type NotificationType } from '@prisma/client';

export interface NotificationTemplate {
  title: string;
  body: string;
  deepLink: string;
  silent?: boolean;
}

type TemplateContext = Record<string, string | number | undefined>;

const templateBuilders: Record<
  NotificationType,
  (ctx: TemplateContext) => NotificationTemplate
> = {
  VAN_WITHIN_1KM: (ctx) => ({
    title: 'Van approaching',
    body: `Van is about ${ctx.distanceMeters ?? 1000}m away.`,
    deepLink: `schoolvan://trip/${ctx.tripId}/track`,
  }),
  VAN_WITHIN_500M: (ctx) => ({
    title: 'Van is very close',
    body: `Van is about ${ctx.distanceMeters ?? 500}m away.`,
    deepLink: `schoolvan://trip/${ctx.tripId}/track`,
  }),
  STUDENT_PICKED: (ctx) => ({
    title: 'Student picked up',
    body: `${ctx.studentName ?? 'Your child'} has been picked up.`,
    deepLink: `schoolvan://trip/${ctx.tripId}/status`,
  }),
  STUDENT_DROPPED: (ctx) => ({
    title: 'Student dropped',
    body: `${ctx.studentName ?? 'Your child'} has been dropped off.`,
    deepLink: `schoolvan://trip/${ctx.tripId}/status`,
  }),
  VAN_REACHED_SCHOOL: (ctx) => ({
    title: 'Van reached school',
    body: 'The school van has arrived at school.',
    deepLink: `schoolvan://trip/${ctx.tripId}/track`,
  }),
  RETURN_TRIP_STARTED: (ctx) => ({
    title: 'Return trip started',
    body: 'The return trip has started.',
    deepLink: `schoolvan://trip/${ctx.tripId}/track`,
  }),
  SOS_EMERGENCY: (ctx) => ({
    title: 'Emergency alert',
    body: ctx.description?.toString() ?? 'Driver triggered SOS alert.',
    deepLink: `schoolvan://trip/${ctx.tripId}/sos`,
  }),
  DRIVER_OFFLINE: () => ({
    title: 'Driver offline',
    body: 'Driver connection was lost during an active trip.',
    deepLink: 'schoolvan://trips',
  }),
  TRIP_DELAYED: (ctx) => ({
    title: 'Trip delayed',
    body: `Trip delay estimated: ${ctx.delayMinutes ?? 10} minutes.`,
    deepLink: `schoolvan://trip/${ctx.tripId}/track`,
  }),
  SUBSCRIPTION_EXPIRY: () => ({
    title: 'Subscription expiring',
    body: 'Your school subscription is expiring soon.',
    deepLink: 'schoolvan://billing',
  }),
  SCHOOL_ANNOUNCEMENT: (ctx) => ({
    title: ctx.title?.toString() ?? 'School announcement',
    body: ctx.body?.toString() ?? 'You have a new announcement.',
    deepLink: 'schoolvan://announcements',
  }),
};

export function buildNotificationTemplate(
  type: NotificationType,
  context: TemplateContext = {},
): NotificationTemplate {
  return templateBuilders[type](context);
}

/** FCM data payload for mobile deep links (foreground + background handlers). */
export function buildDeepLinkDataPayload(input: {
  notificationId: string;
  type: NotificationType;
  schoolId: string;
  tripId: string | null;
  deepLink: string | null;
  metadata?: unknown;
}): Record<string, string> {
  const meta =
    input.metadata && typeof input.metadata === 'object'
      ? JSON.stringify(input.metadata)
      : '';
  return {
    notificationId: input.notificationId,
    type: input.type,
    schoolId: input.schoolId,
    tripId: input.tripId ?? '',
    deepLink: input.deepLink ?? 'schoolvan://home',
    metadata: meta,
    click_action: 'FLUTTER_NOTIFICATION_CLICK',
  };
}
