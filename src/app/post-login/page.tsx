import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

function redirectByRole(role: string | undefined, status: string | undefined) {
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (role === "STAFF") {
    redirect("/dashboard/staff");
  }

  if (role === "OFFICIAL" && status !== "APPROVED") {
    redirect("/login?error=official_pending");
  }

  redirect("/dashboard/official");
}

export default async function PostLoginPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fpost-login");
  }

  redirectByRole(session.user.role, session.user.status);
}
