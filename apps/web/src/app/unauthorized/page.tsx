import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="text-muted-foreground">You do not have access to this area.</p>
      <Button asChild>
        <Link href="/login">Back to login</Link>
      </Button>
    </div>
  );
}
