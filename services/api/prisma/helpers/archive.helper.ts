import { Prisma, PrismaClient } from '@prisma/client';

export type ArchiveTrackingLogsOptions = {
  /** Move logs older than this many days (default 90) */
  olderThanDays?: number;
  /** Max rows per archive batch (default 50_000) */
  batchSize?: number;
};

const DEFAULT_OLDER_THAN_DAYS = 90;
const DEFAULT_ARCHIVE_BATCH = 50_000;

/**
 * Move completed-trip GPS points from hot `tracking_logs` to `tracking_logs_archive`.
 * Run as a scheduled job (BullMQ / cron), not on the request path.
 */
export async function archiveTrackingLogs(
  prisma: PrismaClient,
  options?: ArchiveTrackingLogsOptions,
): Promise<{ archived: number; deleted: number }> {
  const olderThanDays = options?.olderThanDays ?? DEFAULT_OLDER_THAN_DAYS;
  const batchSize = options?.batchSize ?? DEFAULT_ARCHIVE_BATCH;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        school_id: string;
        trip_id: string;
        van_id: string | null;
        latitude: Prisma.Decimal;
        longitude: Prisma.Decimal;
        heading: Prisma.Decimal | null;
        speed: Prisma.Decimal | null;
        accuracy: Prisma.Decimal | null;
        event_timestamp: Date;
      }>
    >`
      SELECT tl.id, tl.school_id, tl.trip_id, tl.van_id,
             tl.latitude, tl.longitude, tl.heading, tl.speed, tl.accuracy,
             tl.event_timestamp
      FROM tracking_logs tl
      INNER JOIN trips t ON t.id = tl.trip_id
      WHERE tl.event_timestamp < ${cutoff}
        AND t.status IN ('COMPLETED', 'CANCELLED')
      ORDER BY tl.event_timestamp
      LIMIT ${batchSize}
    `;

    if (rows.length === 0) {
      return { archived: 0, deleted: 0 };
    }

    const ids = rows.map((r) => r.id);

    await tx.$executeRaw`
      INSERT INTO tracking_logs_archive (
        id, school_id, trip_id, van_id,
        latitude, longitude, heading, speed, accuracy,
        location, event_timestamp, archived_at
      )
      SELECT
        tl.id, tl.school_id, tl.trip_id, tl.van_id,
        tl.latitude, tl.longitude, tl.heading, tl.speed, tl.accuracy,
        tl.location, tl.event_timestamp, NOW()
      FROM tracking_logs tl
      WHERE tl.id IN (${Prisma.join(ids)})
    `;

    const deleted = await tx.trackingLog.deleteMany({
      where: { id: { in: ids } },
    });

    return { archived: rows.length, deleted: deleted.count };
  });
}
