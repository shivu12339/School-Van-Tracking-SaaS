export interface GpsLocationPayload {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy?: number;
  timestamp: string;
}

export interface VanLocationBroadcast extends GpsLocationPayload {
  tripId: string;
  schoolId: string;
  vanId: string;
  driverId: string;
}

export interface EtaPayload {
  tripId: string;
  studentId: string;
  etaMinutes: number;
  distanceMeters: number;
  updatedAt: string;
}

export interface TrackingLogBatchItem extends GpsLocationPayload {
  schoolId: string;
  tripId: string;
  vanId?: string;
}
