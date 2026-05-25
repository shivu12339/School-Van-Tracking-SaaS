import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { Driver, Parent, Route, Student, Trip, TripAnalytics, Van } from '@/types/fleet';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  direction?: string;
}

export function createResourceService<T>(basePath: string) {
  return {
    list: (params?: ListParams) =>
      apiClient.get<PaginatedResponse<T>>(basePath, { params }).then((r) => r.data),
    get: (id: string) => apiClient.get<T>(`${basePath}/${id}`).then((r) => r.data),
    create: (data: unknown) => apiClient.post<T>(basePath, data).then((r) => r.data),
    update: (id: string, data: unknown) =>
      apiClient.patch<T>(`${basePath}/${id}`, data).then((r) => r.data),
    remove: (id: string) => apiClient.delete(`${basePath}/${id}`).then((r) => r.data),
  };
}

export const driversService = createResourceService<Driver>('/drivers');
export const vansService = createResourceService<Van>('/vans');
export const studentsService = createResourceService<Student>('/students');
export const parentsService = createResourceService<Parent>('/parents');
export const routesService = createResourceService<Route>('/routes');

export const tripsService = {
  ...createResourceService<Trip>('/trips'),
  active: () => apiClient.get<Trip[]>('/trips/active').then((r) => r.data),
  analytics: (from?: string, to?: string) =>
    apiClient
      .get<TripAnalytics>('/trips/analytics', { params: { from, to } })
      .then((r) => r.data),
  schedule: (data: { routeId: string; tripDate: string; vanId?: string; driverId?: string }) =>
    apiClient.post('/trips/schedule', data).then((r) => r.data),
  cancel: (id: string) => apiClient.post(`/trips/${id}/cancel`).then((r) => r.data),
};
