import Redis from 'ioredis-mock';

export function createRedisMock(): Redis {
  return new Redis();
}

export function createRedisServiceMock() {
  const client = createRedisMock();
  return {
    getClient: () => client,
    onModuleDestroy: async () => client.quit(),
  };
}
