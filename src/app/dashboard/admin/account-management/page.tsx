import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";

import AccountManagementClient from "./account-management-client";

export const dynamic = "force-dynamic";

export default async function AdminAccountManagementPage() {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.ADMIN], {
    unauthenticatedRedirect: "/login?role=ADMIN",
  });

  return <AccountManagementClient />;
}
