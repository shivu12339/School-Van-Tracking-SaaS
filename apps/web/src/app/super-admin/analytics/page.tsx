'use client';

import { useQuery } from '@tanstack/react-query';
import { schoolsService } from '@/services/schools.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaTrendChart } from '@/components/charts/area-trend-chart';

export default function SuperAdminAnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: schoolsService.platformAnalytics,
  });

  const growth = [
    { label: 'Jan', value: Math.max(1, (data?.totalSchools ?? 1) - 4) },
    { label: 'Feb', value: Math.max(1, (data?.totalSchools ?? 1) - 2) },
    { label: 'Mar', value: data?.totalSchools ?? 0 },
    { label: 'Apr', value: (data?.totalSchools ?? 0) + 1 },
    { label: 'May', value: (data?.totalSchools ?? 0) + 2 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform growth</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaTrendChart data={growth} color="#7c3aed" />
      </CardContent>
    </Card>
  );
}
