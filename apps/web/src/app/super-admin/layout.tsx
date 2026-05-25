import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SUPER_ADMIN_NAV } from '@/constants/routes';
import { ErrorBoundary } from '@/components/error-boundary';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <DashboardShell title="Super Admin" nav={SUPER_ADMIN_NAV}>
        {children}
      </DashboardShell>
    </ErrorBoundary>
  );
}
