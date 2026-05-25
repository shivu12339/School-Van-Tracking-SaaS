import { Prisma } from '@prisma/client';

/**
 * Client extension: slow-query logging in non-production environments.
 * Attach via PrismaService.createExtendedClient().
 */
export function slowQueryLoggingExtension(thresholdMs = 200) {
  return Prisma.defineExtension({
    name: 'slowQueryLogging',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now();
          const result = await query(args);
          const elapsed = Date.now() - start;
          if (elapsed >= thresholdMs && process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[prisma:slow] ${model}.${operation} ${elapsed}ms`);
          }
          return result;
        },
      },
    },
  });
}
