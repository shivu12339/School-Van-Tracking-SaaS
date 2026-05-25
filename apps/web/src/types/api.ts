export interface ApiMeta {
  requestId: string | null;
  timestamp: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginatedMeta;
}
