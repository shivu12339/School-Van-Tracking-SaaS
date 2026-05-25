'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminSettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Super admin:</span> {user?.email}
        </p>
        <p className="text-muted-foreground">
          Platform-wide configuration (billing, feature flags, maintenance mode) is controlled via
          environment variables and the API deployment pipeline.
        </p>
      </CardContent>
    </Card>
  );
}
