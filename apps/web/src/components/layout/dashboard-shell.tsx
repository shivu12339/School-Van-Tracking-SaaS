'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Bus,
  CalendarClock,
  CreditCard,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Route,
  UserCog,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from '@/constants/query-keys';
import { useNotificationStore } from '@/stores/notification.store';

const ICONS = {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  Activity,
  Map,
  UserCog,
  Bus,
  GraduationCap,
  Users,
  Route,
  CalendarClock,
  Bell,
  FileBarChart,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

interface DashboardShellProps {
  title: string;
  nav: readonly NavItem[];
  children: React.ReactNode;
}

export function DashboardShell({ title, nav, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const socketUnread = useNotificationStore((s) => s.unread);
  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => notificationsService.unreadCount(),
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unread = socketUnread || unreadQuery.data?.unread || 0;

  async function logout() {
    await authService.logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          'sticky top-0 flex h-screen flex-col border-r bg-card transition-all',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle sidebar">
            <Menu className="h-5 w-5" />
          </Button>
          {!collapsed && <span className="font-semibold">School Van</span>}
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          {!collapsed && user && (
            <p className="mb-2 truncate text-xs text-muted-foreground">{user.email}</p>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
          <h1 className="text-lg font-semibold">{title}</h1>
          {user && unread > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              <Bell className="h-3.5 w-3.5" />
              {unread}
            </span>
          )}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
