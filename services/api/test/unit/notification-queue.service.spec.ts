jest.mock('bullmq', () => {
  const close = jest.fn().mockResolvedValue(undefined);
  const add = jest.fn().mockResolvedValue({ id: 'job-1' });
  return {
    Queue: jest.fn().mockImplementation(() => ({ add, close })),
  };
});

import { NotificationQueueService } from '../../src/notifications/services/notification-queue.service';

describe('NotificationQueueService', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('redis://localhost:6379'),
  };

  it('enqueues to DLQ on failure path', async () => {
    const service = new NotificationQueueService(config as never);
    await service.moveToDlq({ notificationId: 'n1', reason: 'fcm_failed' });
    expect(service.dlqQueue.add).toHaveBeenCalledWith(
      'failed',
      expect.objectContaining({ notificationId: 'n1' }),
      expect.any(Object),
    );
  });
});
