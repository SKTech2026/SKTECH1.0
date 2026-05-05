import { Role } from "@prisma/client";
import nextDynamic from "next/dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

const MobileStaffScannerClient = nextDynamic(() => import("./scanner-client"), {
  loading: () => (
    <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-4 text-sm text-slate-300">
      Initializing scanner...
    </div>
  ),
});

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export default async function MobileStaffScannerPage() {
  const session = await getServerSession(authOptions);
  const authorized = requireRole(session, [Role.STAFF]);

  if (!authorized.user.municipalityPresidentId) {
    redirect("/unauthorized?error=staff_unassigned");
  }

  return <MobileStaffScannerClient />;
}
