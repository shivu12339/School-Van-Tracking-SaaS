'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/stores/toast.store';

export default function NotificationsPage() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list({ limit: 20 }),
  });
  const broadcast = useMutation({
    mutationFn: () => notificationsService.broadcast({ schoolId: schoolId!, title, body }),
    onSuccess: () => toast({ title: 'Announcement queued' }),
    onError: () => toast({ title: 'Broadcast failed', variant: 'destructive' }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Send announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <Button onClick={() => broadcast.mutate()} disabled={!schoolId || !title || !body}>
            Broadcast to parents
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {list.data?.items.map((n) => (
            <div key={n.id} className="rounded-lg border p-3">
              <p className="font-medium">{n.title}</p>
              <p className="text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
