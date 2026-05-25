'use client';

import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/health.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PlatformHealthPage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: healthService.check,
    refetchInterval: 15_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">API status</span>
          <Badge variant={health.isSuccess ? 'success' : 'destructive'}>
            {health.isSuccess ? health.data?.status ?? 'ok' : 'down'}
          </Badge>
        </div>
        {health.data?.uptime != null && (
          <p className="text-sm">Uptime: {Math.floor(health.data.uptime)}s</p>
        )}
      </CardContent>
    </Card>
  );
}
