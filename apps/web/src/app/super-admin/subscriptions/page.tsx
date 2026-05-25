'use client';

import { useQuery } from '@tanstack/react-query';
import { schoolsService } from '@/services/schools.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export default function SubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['schools', 'subscriptions'],
    queryFn: () => schoolsService.list({ limit: 50 }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {data?.items.map((school) => (
          <div key={school.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{school.name}</p>
              <p className="text-sm text-muted-foreground">{school.code}</p>
            </div>
            <div className="text-right">
              <Badge>{school.subscription?.billingStatus ?? 'N/A'}</Badge>
              <p className="mt-1 text-sm">
                {school.subscription?.planCatalog
                  ? formatCurrency(Number(school.subscription.planCatalog.monthlyPrice))
                  : '—'}
                /mo
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
