CREATE EXTENSION IF NOT EXISTS postgis;

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
