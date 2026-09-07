import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import EventsManagementClient from "@/app/dashboard/events/events-management-client";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MobileStaffEventsPage() {
  const session = await getServerSession(authOptions);
  const authorized = requireRole(session, [Role.STAFF]);

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
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Staff Mobile</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Event Management</h1>
        <p className="mt-1 text-sm text-muted">
          View and manage real events for your assigned municipality.
        </p>
      </section>
      <EventsManagementClient
        initialEvents={[]}
        eventBasePath="/mobile/staff/events"
        compact
      />
    </div>
  );
}
