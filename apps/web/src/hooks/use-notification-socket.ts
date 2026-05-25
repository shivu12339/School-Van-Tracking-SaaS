'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { env } from '@/lib/env';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';

const NOTIFICATION_EVENTS = {
  NEW: 'notification:new',
  BADGE: 'notification:badge',
} as const;

export function useNotificationSocket() {
  const user = useAuthStore((s) => s.user);
  const setUnread = useNotificationStore((s) => s.setUnread);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);

  useEffect(() => {
    if (!user) return;

    const socket = io(`${env.wsBaseUrl}/notifications`, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 20_000,
      auth: (cb) => {
        void (async () => {
          try {
            const res = await fetch('/api/auth/token', { credentials: 'include' });
            if (!res.ok) {
              cb({ token: null });
              return;
            }
            const json = (await res.json().catch(() => ({}))) as { accessToken?: string };
            cb({ token: json.accessToken ?? null });
          } catch {
            cb({ token: null });
          }
        })();
      },
    });

    socket.on(NOTIFICATION_EVENTS.BADGE, (payload: { unread: number }) => {
      setUnread(payload.unread);
    });
    socket.on(NOTIFICATION_EVENTS.NEW, () => {
      incrementUnread();
    });

    socket.on('connect_error', (err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[notification-socket] connect_error', err.message);
      }
      if (/Unauthorized|jwt|token/i.test(err.message)) {
        void fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user?.id, setUnread, incrementUnread]);
}
