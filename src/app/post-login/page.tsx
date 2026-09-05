import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

function redirectByRole(role: string | undefined) {
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (role === "STAFF") {
    redirect("/dashboard/staff");
  }

  redirect("/dashboard/official");
}

export default async function PostLoginPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fpost-login");
  }

  redirectByRole(session.user.role);
}
