import { Prisma, PrismaClient } from '@prisma/client';

/** Default chunk size for createMany / bulk raw inserts */
export const DEFAULT_BATCH_SIZE = 500;

/**
 * Insert rows in chunks to avoid oversized transactions and packet limits.
 */
export async function batchCreateMany<T extends Record<string, unknown>>(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  data: T[],
  options?: { batchSize?: number; skipDuplicates?: boolean },
): Promise<number> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const delegate = prisma[model] as unknown as {
    createMany: (args: {
      data: T[];
      skipDuplicates?: boolean;
    }) => Promise<{ count: number }>;
  };

  let inserted = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    const result = await delegate.createMany({
      data: chunk,
      skipDuplicates: options?.skipDuplicates,
    });
    inserted += result.count;
  }
  return inserted;
}

/** Tracking log row shape for high-frequency GPS batch writes */
export type TrackingLogInsert = {
  id?: string;
  schoolId: string;
  tripId: string;
  vanId?: string | null;
  latitude: Prisma.Decimal | number;
  longitude: Prisma.Decimal | number;
  heading?: Prisma.Decimal | number | null;
  speed?: Prisma.Decimal | number | null;
  accuracy?: Prisma.Decimal | number | null;
  eventTimestamp: Date;
};
