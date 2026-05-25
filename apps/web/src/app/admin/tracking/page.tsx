'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LiveTrackingMap } from '@/components/maps/live-tracking-map';
import { useTrackingStore } from '@/stores/tracking.store';
import { tripsService } from '@/services/resources.service';
import { trackingService } from '@/services/tracking.service';
import { queryKeys } from '@/constants/query-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LiveTrackingPage() {
  const liveVans = useTrackingStore((s) => s.liveVans);
  const setVanLocation = useTrackingStore((s) => s.setVanLocation);
  const onlineDrivers = useTrackingStore((s) => s.onlineDrivers);
  const sosAlerts = useTrackingStore((s) => s.sosAlerts);
  const vans = useMemo(() => Object.values(liveVans), [liveVans]);

  const activeTrips = useQuery({
    queryKey: queryKeys.fleet.tripsActive,
    queryFn: tripsService.active,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (!activeTrips.data?.length) return;
    void Promise.all(
      activeTrips.data.map(async (trip) => {
        const loc = await trackingService.live(trip.id);
        if (loc) setVanLocation(loc);
      }),
    );
  }, [activeTrips.data, setVanLocation]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Live van map</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveTrackingMap vans={vans} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active trips ({activeTrips.data?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {activeTrips.data?.map((t) => (
              <Badge key={t.id} variant="outline">
                {t.route?.routeName ?? t.id.slice(0, 8)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Driver status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(onlineDrivers).length === 0 && (
              <p className="text-muted-foreground">Waiting for realtime events...</p>
            )}
            {Object.entries(onlineDrivers).map(([id, online]) => (
              <div key={id} className="flex items-center justify-between">
                <span className="font-mono text-xs">{id.slice(0, 8)}</span>
                <Badge variant={online ? 'success' : 'secondary'}>
                  {online ? 'Online' : 'Offline'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SOS alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {sosAlerts.length === 0 && (
              <p className="text-muted-foreground">No active SOS alerts</p>
            )}
            {sosAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/30"
              >
                <p className="font-medium text-red-800 dark:text-red-200">
                  Trip {alert.tripId.slice(0, 8)}
                </p>
                <p className="text-red-700 dark:text-red-300">
                  {alert.description ?? 'Emergency triggered'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
