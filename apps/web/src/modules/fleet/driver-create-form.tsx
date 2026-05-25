'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { driversService } from '@/services/resources.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/stores/toast.store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  licenseNumber: z.string().min(3),
  employeeCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const FIELDS: { name: keyof FormValues; type: string }[] = [
  { name: 'email', type: 'email' },
  { name: 'password', type: 'password' },
  { name: 'firstName', type: 'text' },
  { name: 'lastName', type: 'text' },
  { name: 'phone', type: 'text' },
  { name: 'licenseNumber', type: 'text' },
  { name: 'employeeCode', type: 'text' },
];

export function DriverCreateForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: 'Driver@12345',
      firstName: '',
      licenseNumber: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await driversService.create(values);
      toast({ title: 'Driver created' });
      form.reset();
      setOpen(false);
      onCreated();
    } catch (e) {
      toast({
        title: 'Create failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New driver</DialogTitle>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          {FIELDS.map(({ name, type }) => (
            <div key={name} className="space-y-1">
              <Label>{name}</Label>
              <Input type={type} {...form.register(name)} />
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
