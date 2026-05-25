import { Injectable } from '@nestjs/common';
import { TripStudentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProximityResult {
  studentId: string;
  parentId: string;
  parentUserId: string;
  distanceMeters: number;
}

/**
 * PostGIS-backed proximity queries for geofence evaluation.
 */
@Injectable()
export class RadiusCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingStudentsWithDistance(input: {
    schoolId: string;
    tripId: string;
    latitude: number;
    longitude: number;
  }): Promise<ProximityResult[]> {
    const rows = await this.prisma.$queryRaw<
      {
        student_id: string;
        parent_id: string;
        parent_user_id: string;
        distance_meters: number;
      }[]
    >`
      SELECT
        s.id AS student_id,
        s.parent_id AS parent_id,
        p.user_id AS parent_user_id,
        ST_Distance(
          s.home_location,
          ST_SetSRID(ST_MakePoint(${input.longitude}::float, ${input.latitude}::float), 4326)::geography
        ) AS distance_meters
      FROM students s
      INNER JOIN parents p ON p.id = s.parent_id
      INNER JOIN trip_students ts ON ts.student_id = s.id
      WHERE ts.trip_id = ${input.tripId}::uuid
        AND s.school_id = ${input.schoolId}::uuid
        AND s.home_location IS NOT NULL
        AND s.deleted_at IS NULL
        AND ts.status = ${TripStudentStatus.PENDING}::"TripStudentStatus"
      ORDER BY distance_meters ASC
    `;

    return rows.map((r) => ({
      studentId: r.student_id,
      parentId: r.parent_id,
      parentUserId: r.parent_user_id,
      distanceMeters: Number(r.distance_meters),
    }));
  }

  haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * earthRadius * Math.asin(Math.sqrt(a));
  }
}
