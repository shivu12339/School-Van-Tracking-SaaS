import { Prisma } from '@prisma/client';

/** WGS84 SRID used across PostGIS geography columns */
export const WGS84_SRID = 4326;

export type LatLng = { latitude: number; longitude: number };

/**
 * Build a parameterized ST_MakePoint geography expression for raw queries.
 * Usage: prisma.$queryRaw`SELECT ${geoPointSql(lat, lng)} AS point`
 */
export function geoPointSql(
  latitude: number | Prisma.Decimal,
  longitude: number | Prisma.Decimal,
): Prisma.Sql {
  const lat = typeof latitude === 'object' ? latitude.toNumber() : latitude;
  const lng = typeof longitude === 'object' ? longitude.toNumber() : longitude;
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), ${WGS84_SRID})::geography`;
}

/** Distance in meters between two points (geography, geodesic). */
export function distanceMetersSql(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): Prisma.Sql {
  return Prisma.sql`
    ST_Distance(
      ST_SetSRID(ST_MakePoint(${aLng}, ${aLat}), ${WGS84_SRID})::geography,
      ST_SetSRID(ST_MakePoint(${bLng}, ${bLat}), ${WGS84_SRID})::geography
    )
  `;
}

/** Haversine-style filter: points within radiusMeters of center (uses geography index when available). */
export function withinRadiusWhere(
  column: string,
  center: LatLng,
  radiusMeters: number,
): Prisma.Sql {
  return Prisma.sql`
    ST_DWithin(
      ${Prisma.raw(column)},
      ST_SetSRID(ST_MakePoint(${center.longitude}, ${center.latitude}), ${WGS84_SRID})::geography,
      ${radiusMeters}
    )
  `;
}
