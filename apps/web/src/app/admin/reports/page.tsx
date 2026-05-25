'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Trip, pickup, and driver performance reports will appear here once the reports API module is
        connected.
      </CardContent>
    </Card>
  );
}
