'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/stores/toast.store';

const schema = z.object({
  email: z.string().email(),
  schoolCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', schoolCode: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await authService.forgotPassword(values);
      toast({
        title: 'Check your email',
        description: 'If an account exists, reset instructions were sent.',
      });
    } catch {
      toast({
        title: 'Request submitted',
        description: 'If an account exists, reset instructions were sent.',
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolCode">School code (optional)</Label>
              <Input id="schoolCode" {...form.register('schoolCode')} />
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Send reset link
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

