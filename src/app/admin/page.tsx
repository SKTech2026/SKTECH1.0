import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?role=ADMIN&callbackUrl=%2Fdashboard%2Fadmin");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "STAFF") {
    redirect("/dashboard/staff");
  }

  if (session.user.role === "OFFICIAL" && session.user.status === "APPROVED") {
    redirect("/dashboard/official");
  }

  redirect("/login?role=ADMIN&error=official_pending");
}
