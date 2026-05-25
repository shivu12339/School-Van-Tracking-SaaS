import { Prisma, PrismaClient } from '@prisma/client';
export declare const DEFAULT_BATCH_SIZE = 500;
export declare function batchCreateMany<T extends Record<string, unknown>>(prisma: PrismaClient, model: keyof PrismaClient, data: T[], options?: {
    batchSize?: number;
    skipDuplicates?: boolean;
}): Promise<number>;
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
//# sourceMappingURL=batch.helper.d.ts.map