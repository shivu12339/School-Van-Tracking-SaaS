import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SCHOOL_ADMIN_NAV } from '@/constants/routes';
import { ErrorBoundary } from '@/components/error-boundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <DashboardShell title="School Admin" nav={SCHOOL_ADMIN_NAV}>
        {children}
      </DashboardShell>
    </ErrorBoundary>
  );
}
