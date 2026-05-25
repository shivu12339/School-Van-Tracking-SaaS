import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { distanceMetersSql, geoPointSql, LatLng, withinRadiusWhere } from '../../prisma/helpers/geo.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async distanceMeters(a: LatLng, b: LatLng): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ meters: number }[]>`
      SELECT ${distanceMetersSql(a.latitude, a.longitude, b.latitude, b.longitude)} AS meters
    `;
    return Number(rows[0]?.meters ?? 0);
  }

  /** Students within radius of a point (uses GIST index on home_location). */
  async findStudentIdsWithinRadius(
    schoolId: string,
    center: LatLng,
    radiusMeters: number,
  ): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT s.id
      FROM students s
      WHERE s.school_id = ${schoolId}::uuid
        AND s.deleted_at IS NULL
        AND s.home_location IS NOT NULL
        AND ${withinRadiusWhere('s.home_location', center, radiusMeters)}
    `;
    return rows.map((r) => r.id);
  }

  /** Route playback polyline for a trip (ordered by event time). */
  async getTripPlaybackPoints(
    schoolId: string,
    tripId: string,
    from?: Date,
    to?: Date,
  ): Promise<{ latitude: number; longitude: number; eventTimestamp: Date }[]> {
    const fromClause = from ? Prisma.sql`AND event_timestamp >= ${from}` : Prisma.empty;
    const toClause = to ? Prisma.sql`AND event_timestamp <= ${to}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      { latitude: Prisma.Decimal; longitude: Prisma.Decimal; event_timestamp: Date }[]
    >`
      SELECT latitude, longitude, event_timestamp
      FROM tracking_logs
      WHERE school_id = ${schoolId}::uuid
        AND trip_id = ${tripId}::uuid
        ${fromClause}
        ${toClause}
      ORDER BY event_timestamp ASC
    `;

    return rows.map((r) => ({
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      eventTimestamp: r.event_timestamp,
    }));
  }

  pointSql(latitude: number, longitude: number): Prisma.Sql {
    return geoPointSql(latitude, longitude);
  }
}
