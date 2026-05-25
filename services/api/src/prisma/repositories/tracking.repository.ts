import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  batchCreateMany,
  TrackingLogInsert,
} from '../../../prisma/helpers/batch.helper';
import { normalizePagination, buildPaginatedResult } from '../../../prisma/helpers/pagination.helper';
import { BaseRepository } from './base.repository';

@Injectable()
export class TrackingRepository extends BaseRepository {
  /**
   * High-frequency GPS batch insert (triggers sync geography via DB trigger).
   */
  async insertBatch(logs: TrackingLogInsert[]): Promise<number> {
    if (logs.length === 0) return 0;
    return batchCreateMany(this.prisma as unknown as PrismaClient, 'trackingLog', logs, {
      batchSize: 500,
      skipDuplicates: true,
    });
  }

  async findPlayback(
    schoolId: string,
    tripId: string,
    options?: { from?: Date; to?: Date; page?: number; pageSize?: number },
  ) {
    const { page, pageSize, skip, take } = normalizePagination(options);
    const where: Prisma.TrackingLogWhereInput = {
      schoolId,
      tripId,
      ...(options?.from || options?.to
        ? {
            eventTimestamp: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.trackingLog.findMany({
        where,
        orderBy: { eventTimestamp: 'asc' },
        skip,
        take,
        select: {
          id: true,
          latitude: true,
          longitude: true,
          heading: true,
          speed: true,
          accuracy: true,
          eventTimestamp: true,
        },
      }),
      this.prisma.trackingLog.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async latestForTrip(schoolId: string, tripId: string) {
    return this.prisma.trackingLog.findFirst({
      where: { schoolId, tripId },
      orderBy: { eventTimestamp: 'desc' },
    });
  }
}
