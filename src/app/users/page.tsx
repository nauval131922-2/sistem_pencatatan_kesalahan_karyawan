import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import UsersContent from "./UsersContent";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "SINTAK | Kelola User",
};

export default async function UsersPage() {
  const session = await getSession();

  if (!session || session.role !== "Super Admin") {
    redirect("/");
  }

  const db = (await import('@/lib/db')).default;
  const { rows } = await db.execute('SELECT role_name FROM app_roles ORDER BY id ASC');
  const customRoles = ['Super Admin', ...rows.map((r: any) => r.role_name as string)];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
      <PageHeader
        title="Kelola User"
        description="Manajemen akses dan akun pengguna aplikasi."
        showHelp={false}
      />
      <UsersContent
        currentUser={session.username}
        currentUserId={session.userId}
        customRoles={customRoles}
      />
    </div>
  );
}











