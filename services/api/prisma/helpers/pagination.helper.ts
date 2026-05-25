export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export function normalizePagination(input?: PaginationInput): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const page = Math.max(DEFAULT_PAGE, input?.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, input?.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
