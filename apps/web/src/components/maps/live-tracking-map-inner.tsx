'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { env } from '@/lib/env';
import type { VanLocation } from '@/services/tracking.service';

const mapContainerStyle = { width: '100%', height: '480px', borderRadius: '0.75rem' };

interface LiveTrackingMapInnerProps {
  vans: VanLocation[];
  center?: { lat: number; lng: number };
}

export function LiveTrackingMapInner({ vans, center }: LiveTrackingMapInnerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: env.googleMapsKey,
  });

  const defaultCenter = center ?? (vans[0]
    ? { lat: vans[0].latitude, lng: vans[0].longitude }
    : { lat: 12.9716, lng: 77.5946 });

  if (!env.googleMapsKey) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-xl border bg-muted/40 text-sm text-muted-foreground">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live map
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-[480px] animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={13}>
      {vans.map((van) => (
        <Marker
          key={van.tripId}
          position={{ lat: van.latitude, lng: van.longitude }}
          title={`Trip ${van.tripId.slice(0, 8)}`}
        />
      ))}
    </GoogleMap>
  );
}
