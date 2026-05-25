'use client';

import * as Toast from '@radix-ui/react-toast';
import { useToastStore } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          open
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            'fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg',
            t.variant === 'destructive' && 'border-destructive',
          )}
        >
          <Toast.Title className="font-medium">{t.title}</Toast.Title>
          {t.description ? (
            <Toast.Description className="mt-1 text-sm text-muted-foreground">
              {t.description}
            </Toast.Description>
          ) : null}
        </Toast.Root>
      ))}
      <Toast.Viewport />
    </Toast.Provider>
  );
}
