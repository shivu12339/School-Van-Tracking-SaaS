'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClientError } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';

interface ResourceListPageProps<T extends { id: string }> {
  title: string;
  queryKey: string;
  fetcher: (params: { page: number; limit: number; search?: string }) => Promise<PaginatedResponse<T>>;
  columns: ColumnDef<T>[];
}

export function ResourceListPage<T extends { id: string }>({
  title,
  queryKey,
  fetcher,
  columns,
}: ResourceListPageProps<T>) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 10;

  const query = useQuery({
    queryKey: [queryKey, page, search],
    queryFn: () => fetcher({ page: page + 1, limit, search: search || undefined }),
  });

  const { table } = useDataTable({
    data: query.data?.items ?? [],
    columns,
    pageCount: Math.ceil((query.data?.meta.total ?? 0) / limit) || 1,
    pageIndex: page,
    pageSize: limit,
    onPaginationChange: (nextPage) => setPage(nextPage),
  });

  const apiPending = useMemo(() => {
    const err = query.error;
    if (err instanceof ApiClientError && err.statusCode === 404) {
      return 'API module is not available yet. Connect the backend resource endpoints.';
    }
    return null;
  }, [query.error]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
        {apiPending ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{apiPending}</p>
        ) : (
          <DataTable table={table} isLoading={query.isLoading} emptyMessage={`No ${title.toLowerCase()} found`} />
        )}
      </CardContent>
    </Card>
  );
}
