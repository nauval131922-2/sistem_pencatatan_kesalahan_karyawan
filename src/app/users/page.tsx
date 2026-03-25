import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import UsersContent from "./UsersContent";
import type { Metadata } from 'next';
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: 'SINTAK | Kelola User',
};

export default async function UsersPage() {
  const session = await getSession();

  if (!session || session.role !== 'Super Admin') {
    redirect('/');
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Kelola User"
        description="Manajemen akses dan akun pengguna aplikasi."
        showHelp={false}
      />
      <UsersContent currentUser={session.username} currentUserId={session.userId} />
    </div>
  );
}
