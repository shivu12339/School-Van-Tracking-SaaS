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
      transports: ['websocket'],
      auth: (cb) => {
        void (async () => {
          const res = await fetch('/api/auth/token');
          const json = await res.json().catch(() => ({}));
          cb({ token: json.accessToken });
        })();
      },
    });

    socket.on(NOTIFICATION_EVENTS.BADGE, (payload: { unread: number }) => {
      setUnread(payload.unread);
    });
    socket.on(NOTIFICATION_EVENTS.NEW, () => {
      incrementUnread();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, setUnread, incrementUnread]);
}
