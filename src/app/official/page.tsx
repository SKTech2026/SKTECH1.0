import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function OfficialPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/official/auth");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "STAFF") {
    redirect("/dashboard/staff");
  }

  if (session.user.role === "OFFICIAL") {
    redirect("/dashboard/official");
  }

  redirect("/unauthorized");
}
