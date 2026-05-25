'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/lib/env';
import { useAuthStore } from '@/stores/auth.store';
import { useTrackingStore } from '@/stores/tracking.store';
import { useNotificationSocket } from '@/hooks/use-notification-socket';

const SocketContext = createContext<Socket | null>(null);

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
      transports: ['websocket'],
      auth: (cb) => {
        void (async () => {
          const res = await fetch('/api/auth/token');
          const json = await res.json().catch(() => ({}));
          cb({ token: json.accessToken, schoolId: user.schoolId });
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

    setSocket(instance);
    return () => {
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
