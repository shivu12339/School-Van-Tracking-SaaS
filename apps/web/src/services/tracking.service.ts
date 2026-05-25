import { apiClient } from '@/lib/api-client';

export interface VanLocation {
  tripId: string;
  schoolId: string;
  vanId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

export interface PlaybackPoint {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  eventTimestamp: string;
}

export const trackingService = {
  live: (tripId: string) =>
    apiClient.get<VanLocation | null>(`/tracking/trips/${tripId}/live`).then((r) => r.data),

  playback: (tripId: string, from?: string, to?: string) =>
    apiClient
      .get<PlaybackPoint[]>(`/tracking/trips/${tripId}/playback`, { params: { from, to } })
      .then((r) => r.data),
};
