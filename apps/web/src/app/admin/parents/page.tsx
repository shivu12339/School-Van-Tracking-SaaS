'use client';

import { FleetListPage } from '@/modules/fleet/fleet-list-page';
import { parentColumns } from '@/modules/fleet/columns';
import { parentsService } from '@/services/resources.service';

export default function ParentsPage() {
  return (
    <FleetListPage
      title="Parents"
      queryKey={['parents']}
      fetcher={parentsService.list}
      columns={parentColumns}
      onDelete={(id) => parentsService.remove(id)}
    />
  );
}
