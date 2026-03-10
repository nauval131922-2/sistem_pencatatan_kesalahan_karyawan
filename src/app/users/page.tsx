import { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UsersContent from './UsersContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SIKKA | Kelola User',
  description: 'Manajemen pengguna sistem (Super Admin)',
};

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Page-level protection: Only Super Admin can access
  if (session.role !== 'Super Admin') {
    redirect('/');
  }

  return <UsersContent currentUser={session.username} currentUserId={session.userId} />;
}
