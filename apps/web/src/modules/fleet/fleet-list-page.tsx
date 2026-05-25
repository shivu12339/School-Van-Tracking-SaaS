'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { DataTable } from '@/components/tables/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiClientError } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import { toast } from '@/stores/toast.store';

interface FleetListPageProps<T extends { id: string }> {
  title: string;
  queryKey: readonly unknown[];
  fetcher: (params: { page: number; limit: number; search?: string }) => Promise<PaginatedResponse<T>>;
  columns: ColumnDef<T>[];
  onDelete?: (id: string) => Promise<unknown>;
  createForm?: ReactNode;
}

export function FleetListPage<T extends { id: string }>({
  title,
  queryKey,
  fetcher,
  columns: baseColumns,
  onDelete,
  createForm,
}: FleetListPageProps<T>) {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 10;

  const query = useQuery({
    queryKey: [...queryKey, page, search],
    queryFn: () => fetcher({ page: page + 1, limit, search: search || undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => onDelete!(id),
    onSuccess: () => {
      toast({ title: `${title.slice(0, -1)} deleted` });
      void qc.invalidateQueries({ queryKey: [...queryKey] });
    },
    onError: (e) =>
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      }),
  });

  const columns = useMemo(() => {
    if (!onDelete) return baseColumns;
    const actions: ColumnDef<T> = {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={() => {
            if (confirm(`Delete this ${title.toLowerCase().slice(0, -1)}?`)) {
              remove.mutate(row.original.id);
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    };
    return [...baseColumns, actions];
  }, [baseColumns, onDelete, remove, title]);

  const { table } = useDataTable({
    data: query.data?.items ?? [],
    columns,
    pageCount: Math.ceil((query.data?.meta.total ?? 0) / limit) || 1,
    pageIndex: page,
    pageSize: limit,
    onPaginationChange: setPage,
  });

  const apiError = useMemo(() => {
    const err = query.error;
    if (err instanceof ApiClientError && err.statusCode === 404) {
      return 'API endpoint not found. Ensure the API is running.';
    }
    if (err instanceof ApiClientError) return err.message;
    return null;
  }, [query.error]);

  return (
    <div className="space-y-4">
      {createForm}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>{title}</CardTitle>
          <Input
            placeholder="Search..."
            className="max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </CardHeader>
        <CardContent>
          {apiError ? (
            <p className="py-10 text-center text-sm text-destructive">{apiError}</p>
          ) : (
            <DataTable
              table={table}
              isLoading={query.isLoading}
              emptyMessage={`No ${title.toLowerCase()} found`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
