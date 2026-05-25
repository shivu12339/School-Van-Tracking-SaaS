'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader>
        <CardTitle>School settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Signed in as:</span> {user?.email}
        </p>
        <p>
          <span className="text-muted-foreground">Role:</span> {user?.role}
        </p>
        <p>
          <span className="text-muted-foreground">School ID:</span> {user?.schoolId ?? '—'}
        </p>
        <p className="pt-4 text-muted-foreground">
          Subscription and school profile settings are managed via the API. Contact your platform
          administrator for plan changes.
        </p>
      </CardContent>
    </Card>
  );
}
