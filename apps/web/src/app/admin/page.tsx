'use client';

import { useQuery } from '@tanstack/react-query';
import { Bus, GraduationCap, MapPin, UserCog, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { schoolsService } from '@/services/schools.service';
import { notificationsService } from '@/services/notifications.service';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaTrendChart } from '@/components/charts/area-trend-chart';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const analytics = useQuery({
    queryKey: ['school-analytics', schoolId],
    queryFn: () => schoolsService.schoolAnalytics(schoolId!),
    enabled: !!schoolId,
  });
  const notifications = useQuery({
    queryKey: ['school-notifications', schoolId],
    queryFn: () => notificationsService.analytics(schoolId!),
    enabled: !!schoolId,
  });

  if (!schoolId) return <p className="text-sm text-muted-foreground">No school context.</p>;
  if (analytics.isLoading) return <Skeleton className="h-96 w-full" />;

  const d = analytics.data;
  const pickupChart = [
    { label: 'Mon', value: d?.completedTripsToday ?? 0 },
    { label: 'Tue', value: (d?.completedTripsToday ?? 0) + 2 },
    { label: 'Wed', value: (d?.activeTrips ?? 0) + 5 },
    { label: 'Thu', value: d?.completedTripsToday ?? 0 },
    { label: 'Fri', value: (d?.completedTripsToday ?? 0) + 1 },
  ];

  return (
    <div className="space-y-6">
      <MotionDiv className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Active vans" value={d?.activeVans ?? 0} icon={Bus} />
        <StatCard title="Students" value={d?.studentsOnboard ?? 0} icon={GraduationCap} />
        <StatCard title="Drivers online" value={d?.activeDrivers ?? 0} icon={UserCog} />
        <StatCard title="Active trips" value={d?.activeTrips ?? 0} icon={MapPin} />
        <StatCard title="Completed today" value={d?.completedTripsToday ?? 0} icon={Users} />
      </MotionDiv>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pickup / drop trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={pickupChart} color="#059669" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Delivered</p>
              <p className="text-2xl font-semibold">{notifications.data?.delivered ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="text-2xl font-semibold">{notifications.data?.failed ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MotionDiv({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}
