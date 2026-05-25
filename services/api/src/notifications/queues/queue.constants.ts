export const NOTIFICATION_QUEUES = {
  PUSH: 'push-notifications',
  GEOFENCE: 'geofence-processing',
  DELAYED: 'delayed-notifications',
  RETRY: 'notification-retry',
  ANALYTICS: 'notification-analytics',
  /** Dead-letter queue for exhausted retries */
  DLQ: 'notification-dlq',
} as const;

export const QUEUE_DEFAULT_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: false,
};

export const QUEUE_DLQ_OPTIONS = {
  attempts: 1,
  removeOnComplete: 500,
  removeOnFail: 10000,
};
