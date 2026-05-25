export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): { items: T[]; meta: PaginatedMeta } {
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
