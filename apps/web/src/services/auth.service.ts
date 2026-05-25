import { apiClient } from '@/lib/api-client';
import type { AuthUser, LoginPayload } from '@/types/auth';

export const authService = {
  login: (payload: LoginPayload) =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Login failed');
      return json as { user: AuthUser };
    }),

  logout: () => fetch('/api/auth/logout', { method: 'POST' }),

  me: () => apiClient.get<AuthUser>('/auth/me').then((r) => r.data),

  forgotPassword: (payload: { email: string; schoolCode?: string }) =>
    apiClient.post('/auth/forgot-password', payload).then((r) => r.data),
};
