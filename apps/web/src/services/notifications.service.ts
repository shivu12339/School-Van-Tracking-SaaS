import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationAnalytics {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  clicked: number;
}

export const notificationsService = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get<PaginatedResponse<NotificationItem>>('/notifications', { params })
      .then((r) => r.data),

  analytics: (schoolId?: string) =>
    apiClient
      .get<NotificationAnalytics>('/notifications/analytics', { params: { schoolId } })
      .then((r) => r.data),

  broadcast: (data: { schoolId?: string; title: string; body: string; deepLink?: string }) =>
    apiClient.post('/notifications/broadcast', data).then((r) => r.data),

  unreadCount: () =>
    apiClient.get<{ unread: number }>('/notifications/unread-count').then((r) => r.data),

  markAllRead: () => apiClient.patch('/notifications/read-all').then((r) => r.data),
};
