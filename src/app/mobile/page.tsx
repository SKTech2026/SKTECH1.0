import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MobileEntryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === Role.STAFF) {
    redirect("/mobile/staff-scanner");
  }

  if (session.user.role === Role.OFFICIAL) {
    redirect("/mobile/official");
  }

  redirect("/dashboard/admin");
}
