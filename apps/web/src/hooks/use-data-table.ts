'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

export function useDataTable<T>({
  data,
  columns,
  pageCount,
  pageIndex,
  pageSize,
  onPaginationChange,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      onPaginationChange?.(next.pageIndex, next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });
  return useMemo(() => ({ table, sorting }), [table, sorting]);
}
