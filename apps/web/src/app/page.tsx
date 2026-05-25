import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-session';
import { getRoleHomePath } from '@/constants/roles';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  redirect(getRoleHomePath(session.role));
}
