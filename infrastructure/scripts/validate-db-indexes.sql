-- Post-deploy index validation (run against Supabase SQL editor or psql)
-- TripStudent lookups by trip + student
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('TripStudent', 'Trip', 'Notification', 'GpsLocation')
ORDER BY tablename, indexname;

-- Explain typical geofence radius query (adjust ids)
-- EXPLAIN ANALYZE
-- SELECT * FROM "Student" WHERE "schoolId" = '...' AND "deletedAt" IS NULL LIMIT 50;
