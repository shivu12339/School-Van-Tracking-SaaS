'use client';

import { FleetListPage } from '@/modules/fleet/fleet-list-page';
import { studentColumns } from '@/modules/fleet/columns';
import { studentsService } from '@/services/resources.service';

export default function StudentsPage() {
  return (
    <FleetListPage
      title="Students"
      queryKey={['students']}
      fetcher={studentsService.list}
      columns={studentColumns}
      onDelete={(id) => studentsService.remove(id)}
    />
  );
}
