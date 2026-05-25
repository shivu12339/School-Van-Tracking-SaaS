'use client';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { SocketProvider } from './socket-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthBootstrap>
          <SocketProvider>{children}</SocketProvider>
        </AuthBootstrap>
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
