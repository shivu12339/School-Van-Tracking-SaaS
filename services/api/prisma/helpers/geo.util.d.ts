import { Prisma } from '@prisma/client';
export declare const WGS84_SRID = 4326;
export type LatLng = {
    latitude: number;
    longitude: number;
};
export declare function geoPointSql(latitude: number | Prisma.Decimal, longitude: number | Prisma.Decimal): Prisma.Sql;
export declare function distanceMetersSql(aLat: number, aLng: number, bLat: number, bLng: number): Prisma.Sql;
export declare function withinRadiusWhere(column: string, center: LatLng, radiusMeters: number): Prisma.Sql;
//# sourceMappingURL=geo.util.d.ts.map