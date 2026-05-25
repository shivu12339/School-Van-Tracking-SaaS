'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { getRoleHomePath } from '@/constants/roles';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  schoolCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', schoolCode: 'SVT-DEMO-001' },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { user } = await authService.login(values);
      setUser(user);
      const redirect = params.get('redirect') ?? getRoleHomePath(user.role);
      router.replace(redirect);
    } catch (e) {
      toast({
        title: 'Login failed',
        description: e instanceof Error ? e.message : 'Invalid credentials',
        variant: 'destructive',
      });
    }
  }

  return (
    <MotionDiv className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>School Van Admin</CardTitle>
          <CardDescription>Sign in to your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolCode">School code (school admin)</Label>
              <Input id="schoolCode" {...form.register('schoolCode')} />
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-center text-sm">
              <a href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </MotionDiv>
  );
}

function MotionDiv(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <MotionDiv className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>School Van Admin</CardTitle>
              <CardDescription>Loading…</CardDescription>
            </CardHeader>
          </Card>
        </MotionDiv>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
