import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody, ApiSuccess } from '@/types/api';
import { env } from '@/lib/env';

export class ApiClientError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const clientBaseUrl =
  typeof window === 'undefined' ? env.apiBaseUrl : '/api/backend';

export const apiClient = axios.create({
  baseURL: clientBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiSuccess<unknown> | unknown;
    if (body && typeof body === 'object' && 'success' in body && (body as ApiSuccess<unknown>).success) {
      response.data = (body as ApiSuccess<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) refreshPromise = refreshSession().finally(() => { refreshPromise = null; });
        await refreshPromise;
        return apiClient(original);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    const payload = error.response?.data;
    throw new ApiClientError(
      payload?.message ?? error.message ?? 'Request failed',
      payload?.statusCode ?? error.response?.status ?? 500,
      payload?.errors,
    );
  },
);

export async function serverApi<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const { getServerApiUrl } = await import('@/lib/env');
  const res = await fetch(`${getServerApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new ApiClientError(json.message ?? 'Request failed', res.status);
  }
  return (json.success ? json.data : json) as T;
}
