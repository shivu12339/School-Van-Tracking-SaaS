import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/app.constants';

export function toPagination(page?: number, limit?: number): { skip: number; take: number } {
  const safePage = page && page > 0 ? page : DEFAULT_PAGE;
  const safeLimit = limit && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}
