'use client';

import { useQueryClient } from '@tanstack/react-query';
import { FleetListPage } from '@/modules/fleet/fleet-list-page';
import { DriverCreateForm } from '@/modules/fleet/driver-create-form';
import { driverColumns } from '@/modules/fleet/columns';
import { driversService } from '@/services/resources.service';
import { queryKeys } from '@/constants/query-keys';

export default function DriversPage() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: queryKeys.fleet.drivers(0, '') });

  return (
    <FleetListPage
      title="Drivers"
      queryKey={['drivers']}
      fetcher={driversService.list}
      columns={driverColumns}
      onDelete={(id) => driversService.remove(id)}
      createForm={<DriverCreateForm onCreated={invalidate} />}
    />
  );
}
