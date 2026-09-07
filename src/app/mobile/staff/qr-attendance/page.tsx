import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import ScanPage from "@/app/dashboard/scan/page";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileStaffQrAttendancePage() {
  const session = getServerSession(authOptions);
  const authorized = requireRole(await session, [Role.STAFF]);

  if (!authorized.user.municipalityPresidentId) {
    redirect("/unauthorized?error=staff_unassigned");
  }

  return (
    <div className="space-y-4">
      <Link
        href="/mobile/staff"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Staff Mobile Dashboard
      </Link>
      <ScanPage />
    </div>
  );
}
