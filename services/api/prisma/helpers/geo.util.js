"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WGS84_SRID = void 0;
exports.geoPointSql = geoPointSql;
exports.distanceMetersSql = distanceMetersSql;
exports.withinRadiusWhere = withinRadiusWhere;
const client_1 = require("@prisma/client");
exports.WGS84_SRID = 4326;
function geoPointSql(latitude, longitude) {
    const lat = typeof latitude === 'object' ? latitude.toNumber() : latitude;
    const lng = typeof longitude === 'object' ? longitude.toNumber() : longitude;
    return client_1.Prisma.sql `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), ${exports.WGS84_SRID})::geography`;
}
function distanceMetersSql(aLat, aLng, bLat, bLng) {
    return client_1.Prisma.sql `
    ST_Distance(
      ST_SetSRID(ST_MakePoint(${aLng}, ${aLat}), ${exports.WGS84_SRID})::geography,
      ST_SetSRID(ST_MakePoint(${bLng}, ${bLat}), ${exports.WGS84_SRID})::geography
    )
  `;
}
function withinRadiusWhere(column, center, radiusMeters) {
    return client_1.Prisma.sql `
    ST_DWithin(
      ${client_1.Prisma.raw(column)},
      ST_SetSRID(ST_MakePoint(${center.longitude}, ${center.latitude}), ${exports.WGS84_SRID})::geography,
      ${radiusMeters}
    )
  `;
}
//# sourceMappingURL=geo.util.js.map