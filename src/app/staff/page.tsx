import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard%2Fstaff");
  }

  if (session.user.role === "STAFF") {
    redirect("/dashboard/staff");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "OFFICIAL" && session.user.status === "APPROVED") {
    redirect("/dashboard/official");
  }

  redirect("/login?error=official_pending");
}
