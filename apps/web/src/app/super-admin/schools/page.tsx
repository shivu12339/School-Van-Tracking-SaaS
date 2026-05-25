'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { schoolsService } from '@/services/schools.service';
import type { School } from '@/types/school';
import { DataTable } from '@/components/tables/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/stores/toast.store';

export default function SchoolsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 10;

  const list = useQuery({
    queryKey: ['schools', page, search],
    queryFn: () => schoolsService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const impersonate = useMutation({
    mutationFn: (id: string) => schoolsService.impersonate(id),
    onSuccess: async (data) => {
      await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast({ title: 'Impersonation started', description: 'Opening school admin panel...' });
      window.location.href = '/admin';
    },
    onError: () => toast({ title: 'Impersonation failed', variant: 'destructive' }),
  });

  const columns = useMemo<ColumnDef<School>[]>(
    () => [
      { accessorKey: 'name', header: 'School' },
      { accessorKey: 'code', header: 'Code' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'warning'}>{row.original.status}</Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <MotionDiv className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                schoolsService
                  .updateStatus(row.original.id, { status: 'SUSPENDED', isActive: false })
                  .then(() => qc.invalidateQueries({ queryKey: ['schools'] }))
              }
            >
              Suspend
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                schoolsService
                  .updateStatus(row.original.id, { status: 'ACTIVE', isActive: true })
                  .then(() => qc.invalidateQueries({ queryKey: ['schools'] }))
              }
            >
              Activate
            </Button>
            <Button size="sm" onClick={() => impersonate.mutate(row.original.id)}>
              Impersonate
            </Button>
          </MotionDiv>
        ),
      },
    ],
    [impersonate, qc],
  );

  const { table } = useDataTable({
    data: list.data?.items ?? [],
    columns,
    pageCount: Math.ceil((list.data?.meta.total ?? 0) / limit) || 1,
    pageIndex: page,
    pageSize: limit,
    onPaginationChange: setPage,
  });

  return (
    <div className="space-y-6">
      <CreateSchoolForm onCreated={() => qc.invalidateQueries({ queryKey: ['schools'] })} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Schools</CardTitle>
          <Input
            placeholder="Search schools..."
            className="max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </CardHeader>
        <CardContent>
          <DataTable table={table} isLoading={list.isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

function CreateSchoolForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    planTier: 'STANDARD',
    adminEmail: '',
    adminPassword: 'Admin@12345',
    adminFirstName: 'Admin',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await schoolsService.create(form);
    toast({ title: 'School created' });
    setOpen(false);
    onCreated();
  }

  if (!open) return <Button onClick={() => setOpen(true)}>Create school</Button>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard new school</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
          {(['code', 'name', 'planTier', 'adminEmail', 'adminPassword', 'adminFirstName'] as const).map(
            (field) => (
              <div key={field} className="space-y-1">
                <Label>{field}</Label>
                <Input
                  value={form[field]}
                  onChange={(e) => setForm((s) => ({ ...s, [field]: e.target.value }))}
                />
              </div>
            ),
          )}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MotionDiv({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}
