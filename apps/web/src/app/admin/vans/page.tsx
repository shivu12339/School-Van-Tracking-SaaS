'use client';

import { FleetListPage } from '@/modules/fleet/fleet-list-page';
import { vanColumns } from '@/modules/fleet/columns';
import { vansService } from '@/services/resources.service';

export default function VansPage() {
  return (
    <FleetListPage
      title="Vans"
      queryKey={['vans']}
      fetcher={vansService.list}
      columns={vanColumns}
      onDelete={(id) => vansService.remove(id)}
    />
  );
}
