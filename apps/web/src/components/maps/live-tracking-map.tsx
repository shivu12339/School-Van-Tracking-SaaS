'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { VanLocation } from '@/services/tracking.service';

const MapInner = dynamic(() => import('./live-tracking-map-inner').then((m) => m.LiveTrackingMapInner), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full rounded-xl" />,
});

interface LiveTrackingMapProps {
  vans: VanLocation[];
  center?: { lat: number; lng: number };
}

export function LiveTrackingMap(props: LiveTrackingMapProps) {
  return <MapInner {...props} />;
}
