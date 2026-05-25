'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/lib/env';
import { useAuthStore } from '@/stores/auth.store';
import { useTrackingStore } from '@/stores/tracking.store';
import { useNotificationSocket } from '@/hooks/use-notification-socket';

const SocketContext = createContext<Socket | null>(null);

const isProd = process.env.NODE_ENV === 'production';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useNotificationSocket();
  const user = useAuthStore((s) => s.user);
  const [socket, setSocket] = useState<Socket | null>(null);
  const setVanLocation = useTrackingStore((s) => s.setVanLocation);
  const setDriverOnline = useTrackingStore((s) => s.setDriverOnline);
  const addSosAlert = useTrackingStore((s) => s.addSosAlert);

  useEffect(() => {
    if (!user?.schoolId) return;
    const instance = io(`${env.wsBaseUrl}/tracking`, {
      // Polling first lets corporate proxies and Vercel preview networks connect;
      // socket.io upgrades to websocket as soon as the handshake completes.
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
              cb({ token: null, schoolId: user.schoolId });
              return;
            }
            const json = (await res.json().catch(() => ({}))) as { accessToken?: string };
            cb({ token: json.accessToken ?? null, schoolId: user.schoolId });
          } catch {
            cb({ token: null, schoolId: user.schoolId });
          }
        })();
      },
    });

    instance.on('parent:van-location', (payload) => setVanLocation(payload));
    instance.on('admin:van-live', (payload) => setVanLocation(payload));
    instance.on('admin:driver-online', ({ driverId, online }) =>
      setDriverOnline(driverId, online),
    );
    instance.on('admin:sos-alert', (alert) =>
      addSosAlert({
        id: alert.id,
        tripId: alert.tripId,
        description: alert.description,
        createdAt: alert.createdAt ?? new Date().toISOString(),
      }),
    );

    instance.on('connect_error', (err) => {
      if (!isProd) console.warn('[tracking-socket] connect_error', err.message);
      // 401/403 from the server arrive as connect_error with the message body —
      // refresh the access cookie and let the next reconnect pick it up.
      if (/Unauthorized|jwt|token/i.test(err.message)) {
        void fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      }
    });

    setSocket(instance);
    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      setSocket(null);
    };
  }, [user?.id, user?.schoolId, setVanLocation, setDriverOnline, addSosAlert]);

  const value = useMemo(() => socket, [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
