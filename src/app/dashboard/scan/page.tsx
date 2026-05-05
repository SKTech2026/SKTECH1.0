import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";
import ScanClientPage from "./scan-client-page";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN, Role.STAFF]);

  return <ScanClientPage />;
}
