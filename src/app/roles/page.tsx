import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAllPermissions } from "@/lib/permissions";
import RolesContent from "./RolesContent";

export const metadata: Metadata = {
  title: "SINTAK | Hak Akses",
};

export default async function RolesPage() {
  const session = await getSession();

  // Only Super Admin can access this page
  if (!session || session.role !== "Super Admin") {
    redirect("/dashboard?access_denied=1");
  }

  const allPermissions = await getAllPermissions();
  const db = (await import('@/lib/db')).default;
  const { rows } = await db.execute('SELECT * FROM app_roles ORDER BY id ASC');

  const configurableRoles = rows.map((r: any) => ({
    name: r.role_name as string,
    description: r.description as string,
    color: r.color as string,
    bg: r.bg as string,
    border: r.border as string,
  }));

  return <RolesContent allPermissions={allPermissions} customRoles={configurableRoles} />;
}








