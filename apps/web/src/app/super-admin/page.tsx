'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Building2, Bus, IndianRupee, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaTrendChart } from '@/components/charts/area-trend-chart';
import { schoolsService } from '@/services/schools.service';
import { notificationsService } from '@/services/notifications.service';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminDashboardPage() {
  const platform = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: schoolsService.platformAnalytics,
  });
  const notifications = useQuery({
    queryKey: ['notification-analytics'],
    queryFn: () => notificationsService.analytics(),
  });

  if (platform.isLoading) return <Skeleton className="h-96 w-full" />;

  const data = platform.data;
  const chartData = [
    { label: 'Mon', value: (data?.activeTrips ?? 0) + 2 },
    { label: 'Tue', value: (data?.activeTrips ?? 0) + 4 },
    { label: 'Wed', value: data?.activeTrips ?? 0 },
    { label: 'Thu', value: (data?.activeTrips ?? 0) + 1 },
    { label: 'Fri', value: (data?.activeTrips ?? 0) + 3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total schools" value={data?.totalSchools ?? 0} icon={Building2} />
        <StatCard title="Active schools" value={data?.activeSchools ?? 0} icon={Activity} />
        <StatCard title="Active trips" value={data?.activeTrips ?? 0} icon={Bus} />
        <StatCard title="Drivers online" value={data?.driversOnline ?? 0} icon={Users} />
        <StatCard
          title="Est. monthly revenue"
          value={formatCurrency(data?.estimatedMonthlyRevenue ?? 0)}
          icon={IndianRupee}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trip activity</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notification delivery</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sent</p>
              <p className="text-2xl font-semibold">{notifications.data?.sent ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Delivered</p>
              <p className="text-2xl font-semibold">{notifications.data?.delivered ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="text-2xl font-semibold">{notifications.data?.failed ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Read</p>
              <p className="text-2xl font-semibold">{notifications.data?.read ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
