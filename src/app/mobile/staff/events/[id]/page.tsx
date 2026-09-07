import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import EventDetailView from "@/app/dashboard/events/event-detail-view";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

type MobileStaffEventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MobileStaffEventDetailPage({
  params,
}: MobileStaffEventDetailPageProps) {
  const session = await getServerSession(authOptions);
  const authorized = requireRole(session, [Role.STAFF]);
  const { id } = await params;

  if (!authorized.user.municipalityPresidentId) {
    redirect("/unauthorized?error=staff_unassigned");
  }

  return (
    <div className="space-y-4">
      <Link
        href="/mobile/staff/events"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event Management
      </Link>
      <EventDetailView
        id={id}
        eventBasePath="/mobile/staff/events"
        municipalityId={authorized.user.municipalityPresidentId ?? undefined}
      />
    </div>
  );
}
