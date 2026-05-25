import { Prisma, PrismaClient } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

const DEFAULT_TX_OPTIONS: TransactionOptions = {
  maxWait: 10_000,
  timeout: 30_000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

/**
 * Run work inside a single interactive transaction with sensible defaults.
 */
export async function runInTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  return prisma.$transaction(fn, { ...DEFAULT_TX_OPTIONS, ...options });
}

/**
 * Serializable isolation for critical multi-row updates (billing, trip state).
 */
export async function runSerializableTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return runInTransaction(prisma, fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    timeout: 60_000,
  });
}
