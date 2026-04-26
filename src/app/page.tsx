import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFirstAccessibleRoute } from "@/lib/permissions";

export default async function RootPage() {
  const session = await getSession();

  if (!session || !session.userId) {
    redirect("/login");
  }

  const firstRoute = await getFirstAccessibleRoute(session.role);
  redirect(firstRoute);
}











