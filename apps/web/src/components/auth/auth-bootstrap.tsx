'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setUser = useAuthStore((s) => s.setUser);
  const enabled = pathname !== '/login';
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    retry: false,
    enabled,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  return <>{children}</>;
}
