import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function RoleSelectionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fpost-login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "STAFF") {
    redirect("/dashboard/staff");
  }

  if (session.user.status === "APPROVED") {
    redirect("/dashboard/official");
  }

  redirect("/join-official?status=pending");
}
