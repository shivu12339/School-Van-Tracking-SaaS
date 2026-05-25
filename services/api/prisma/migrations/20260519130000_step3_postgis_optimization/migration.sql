-- Step 3: PostGIS GIST indexes, location sync triggers, time-series tuning, archival table

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- GIST indexes (geography columns — not emitted by Prisma migrate diff)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_home_location_gist
  ON students USING GIST (home_location);

CREATE INDEX IF NOT EXISTS idx_vans_current_location_gist
  ON vans USING GIST (current_location);

CREATE INDEX IF NOT EXISTS idx_route_stops_stop_location_gist
  ON route_stops USING GIST (stop_location);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_location_gist
  ON tracking_logs USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location_gist
  ON emergency_alerts USING GIST (location);

-- ---------------------------------------------------------------------------
-- Time-series: BRIN for append-heavy GPS event_timestamp scans
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tracking_logs_event_timestamp_brin
  ON tracking_logs USING BRIN (event_timestamp);

-- Partial index: active trips (realtime dashboards)
CREATE INDEX IF NOT EXISTS idx_trips_in_progress
  ON trips (school_id, van_id, driver_id)
  WHERE status = 'IN_PROGRESS' AND deleted_at IS NULL;

-- Unread notifications feed
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (school_id, user_id, created_at DESC)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Secure session: unique token hash lookup
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_refresh_tokens_token_hash
  ON refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_school_status
  ON refresh_tokens (school_id, status)
  WHERE school_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Archival table (cold GPS storage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking_logs_archive (
  id UUID NOT NULL PRIMARY KEY,
  school_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  van_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(6, 2),
  speed DECIMAL(6, 2),
  accuracy DECIMAL(6, 2),
  location geography(Point, 4326),
  event_timestamp TIMESTAMP(3) NOT NULL,
  archived_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_archive_school_trip_event
  ON tracking_logs_archive (school_id, trip_id, event_timestamp);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_archive_trip_event
  ON tracking_logs_archive (trip_id, event_timestamp);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_archive_archived_at
  ON tracking_logs_archive (archived_at);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_archive_location_gist
  ON tracking_logs_archive USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_tracking_logs_archive_event_brin
  ON tracking_logs_archive USING BRIN (event_timestamp);

-- ---------------------------------------------------------------------------
-- Sync decimal lat/lng → geography(Point, 4326) on write
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_point_from_lat_lng(
  p_lat NUMERIC,
  p_lng NUMERIC
) RETURNS geography AS $$
BEGIN
  IF p_lat IS NULL OR p_lng IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN ST_SetSRID(ST_MakePoint(p_lng::double precision, p_lat::double precision), 4326)::geography;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION trg_students_sync_home_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.home_location := sync_point_from_lat_lng(NEW.home_latitude, NEW.home_longitude);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_sync_home_location ON students;
CREATE TRIGGER students_sync_home_location
  BEFORE INSERT OR UPDATE OF home_latitude, home_longitude ON students
  FOR EACH ROW EXECUTE PROCEDURE trg_students_sync_home_location();

CREATE OR REPLACE FUNCTION trg_vans_sync_current_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_location := sync_point_from_lat_lng(NEW.current_latitude, NEW.current_longitude);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vans_sync_current_location ON vans;
CREATE TRIGGER vans_sync_current_location
  BEFORE INSERT OR UPDATE OF current_latitude, current_longitude ON vans
  FOR EACH ROW EXECUTE PROCEDURE trg_vans_sync_current_location();

CREATE OR REPLACE FUNCTION trg_route_stops_sync_stop_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.stop_location := sync_point_from_lat_lng(NEW.stop_latitude, NEW.stop_longitude);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS route_stops_sync_stop_location ON route_stops;
CREATE TRIGGER route_stops_sync_stop_location
  BEFORE INSERT OR UPDATE OF stop_latitude, stop_longitude ON route_stops
  FOR EACH ROW EXECUTE PROCEDURE trg_route_stops_sync_stop_location();

CREATE OR REPLACE FUNCTION trg_tracking_logs_sync_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := sync_point_from_lat_lng(NEW.latitude, NEW.longitude);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracking_logs_sync_location ON tracking_logs;
CREATE TRIGGER tracking_logs_sync_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON tracking_logs
  FOR EACH ROW EXECUTE PROCEDURE trg_tracking_logs_sync_location();

CREATE OR REPLACE FUNCTION trg_emergency_alerts_sync_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := sync_point_from_lat_lng(NEW.latitude, NEW.longitude);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_alerts_sync_location ON emergency_alerts;
CREATE TRIGGER emergency_alerts_sync_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON emergency_alerts
  FOR EACH ROW EXECUTE PROCEDURE trg_emergency_alerts_sync_location();
