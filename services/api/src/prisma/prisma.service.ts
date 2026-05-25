import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { slowQueryLoggingExtension } from '../../prisma/extensions/prisma-client.extension';
import { buildTenantSoftDeleteExtension } from '../../prisma/extensions/tenant-soft-delete.extension';

export function createAppPrismaClient() {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
  });
  return base.$extends(buildTenantSoftDeleteExtension(base)).$extends(slowQueryLoggingExtension(250));
}

export type AppPrismaClient = ReturnType<typeof createAppPrismaClient>;

/**
 * Nest DI token — delegates all Prisma delegates from the extended client
 * (Prisma 6+ replaces `$use` middleware with `$extends`).
 * Declaration merge is intentional: runtime client is `Object.assign`ed onto the class instance.
 */
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */
export interface PrismaService extends AppPrismaClient {}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** Extended client — keep reference for lifecycle; Object.assign alone breaks `$connect` binding. */
  private readonly db: AppPrismaClient;

  constructor() {
    this.db = createAppPrismaClient();
    Object.assign(this, this.db);
  }

  async onModuleInit(): Promise<void> {
    await this.db.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.$disconnect();
  }

  /** Use for health checks — delegated `$queryRaw` on `this` loses Prisma client binding. */
  async pingDatabase(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      void (async () => {
        await app.close();
      })();
    });
  }

  /** @deprecated Use injected PrismaService directly; client is already extended. */
  createExtendedClient(): AppPrismaClient {
    return this.db;
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */

export type ExtendedPrismaClient = AppPrismaClient;
