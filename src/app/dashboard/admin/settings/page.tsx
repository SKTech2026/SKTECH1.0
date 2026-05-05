import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import SettingsPanel from "@/components/dashboard/settings-panel";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.ADMIN]);

  return (
    <SettingsPanel
      roleLabel="Administrator"
      account={{
        name: authorizedSession.user.name,
        email: authorizedSession.user.email,
        employeeId: authorizedSession.user.employeeId,
        status: authorizedSession.user.status,
      }}
    />
  );
}
