/** Platform-wide BullMQ queue names — domain modules register workers against these. */
export const PLATFORM_QUEUES = {
  DEFAULT: 'platform-default',
  SCHEDULED: 'platform-scheduled',
} as const;

export const DEFAULT_QUEUE_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1500 },
  removeOnComplete: 500,
  removeOnFail: 2000,
};
