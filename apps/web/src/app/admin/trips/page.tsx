'use client';

import { useQuery } from '@tanstack/react-query';
import { FleetListPage } from '@/modules/fleet/fleet-list-page';
import { tripColumns } from '@/modules/fleet/columns';
import { tripsService } from '@/services/resources.service';
import { queryKeys } from '@/constants/query-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TripsPage() {
  const active = useQuery({
    queryKey: queryKeys.fleet.tripsActive,
    queryFn: tripsService.active,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active trips</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {active.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No trips in progress</p>
          )}
          {active.data?.map((trip) => (
            <Badge key={trip.id} variant="success">
              {trip.route?.routeName ?? trip.id.slice(0, 8)} · {trip.direction}
            </Badge>
          ))}
        </CardContent>
      </Card>
      <FleetListPage
        title="Trips"
        queryKey={['trips']}
        fetcher={tripsService.list}
        columns={tripColumns}
        onDelete={(id) => tripsService.cancel(id)}
      />
    </div>
  );
}
