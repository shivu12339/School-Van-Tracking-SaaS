import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { PlatformAnalytics, School, SchoolDashboardAnalytics } from '@/types/school';

export interface ListSchoolsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateSchoolInput {
  code: string;
  name: string;
  planTier: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  address?: string;
  trialDays?: number;
}

export const schoolsService = {
  list: (params?: ListSchoolsParams) =>
    apiClient.get<PaginatedResponse<School>>('/schools', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<School>(`/schools/${id}`).then((r) => r.data),

  create: (data: CreateSchoolInput) =>
    apiClient.post<School>('/schools', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateSchoolInput>) =>
    apiClient.patch<School>(`/schools/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, data: { status: string; isActive?: boolean }) =>
    apiClient.patch<School>(`/schools/${id}/status`, data).then((r) => r.data),

  assignSubscription: (id: string, data: { planTier: string; billingStatus?: string }) =>
    apiClient.post(`/schools/${id}/subscription`, data).then((r) => r.data),

  platformAnalytics: () =>
    apiClient.get<PlatformAnalytics>('/schools/analytics/platform').then((r) => r.data),

  schoolAnalytics: (id: string) =>
    apiClient.get<SchoolDashboardAnalytics>(`/schools/${id}/analytics`).then((r) => r.data),

  impersonate: (id: string) =>
    apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: { role: string; schoolId: string };
    }>(`/schools/${id}/impersonate`).then((r) => r.data),
};
