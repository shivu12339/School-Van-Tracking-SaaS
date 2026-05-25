import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { Driver, Parent, Route, Student, Trip, Van } from '@/types/fleet';

export const driverColumns: ColumnDef<Driver>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) =>
      `${row.original.user.firstName} ${row.original.user.lastName ?? ''}`.trim(),
  },
  { id: 'email', header: 'Email', cell: ({ row }) => row.original.user.email },
  { accessorKey: 'licenseNumber', header: 'License' },
  {
    accessorKey: 'isAvailable',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isAvailable ? 'success' : 'secondary'}>
        {row.original.isAvailable ? 'Available' : 'Unavailable'}
      </Badge>
    ),
  },
];

export const vanColumns: ColumnDef<Van>[] = [
  { accessorKey: 'registrationNo', header: 'Registration' },
  { accessorKey: 'label', header: 'Label' },
  { accessorKey: 'capacity', header: 'Capacity' },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'warning'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
];

export const studentColumns: ColumnDef<Student>[] = [
  { accessorKey: 'fullName', header: 'Name' },
  { accessorKey: 'admissionNumber', header: 'Admission #' },
  { accessorKey: 'grade', header: 'Grade' },
  { accessorKey: 'section', header: 'Section' },
];

export const parentColumns: ColumnDef<Parent>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) =>
      `${row.original.user.firstName} ${row.original.user.lastName ?? ''}`.trim(),
  },
  { id: 'email', header: 'Email', cell: ({ row }) => row.original.user.email },
  { id: 'phone', header: 'Phone', cell: ({ row }) => row.original.user.phone ?? '—' },
];

export const routeColumns: ColumnDef<Route>[] = [
  { accessorKey: 'routeCode', header: 'Code' },
  { accessorKey: 'routeName', header: 'Name' },
  { accessorKey: 'direction', header: 'Direction' },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
];

export const tripColumns: ColumnDef<Trip>[] = [
  {
    accessorKey: 'tripDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.tripDate).toLocaleDateString(),
  },
  { accessorKey: 'direction', header: 'Direction' },
  { accessorKey: 'status', header: 'Status' },
  {
    id: 'route',
    header: 'Route',
    cell: ({ row }) => row.original.route?.routeName ?? '—',
  },
  {
    id: 'driver',
    header: 'Driver',
    cell: ({ row }) => row.original.driver?.user?.firstName ?? '—',
  },
];
