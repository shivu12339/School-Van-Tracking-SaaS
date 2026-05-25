import type { ROLES } from '../constants';

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string | string[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}
