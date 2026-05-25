'use client';

import { FleetListPage } from '@/modules/fleet/fleet-list-page';
import { routeColumns } from '@/modules/fleet/columns';
import { routesService } from '@/services/resources.service';

export default function RoutesPage() {
  return (
    <FleetListPage
      title="Routes"
      queryKey={['routes']}
      fetcher={routesService.list}
      columns={routeColumns}
      onDelete={(id) => routesService.remove(id)}
    />
  );
}
