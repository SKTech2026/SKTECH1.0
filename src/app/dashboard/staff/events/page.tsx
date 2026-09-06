export const dynamic = "force-dynamic";
export const revalidate = 0;

import EventsManagementClient from "@/app/dashboard/events/events-management-client";

export default function StaffEventsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-glass-border bg-surface-elevated px-6 py-5 shadow-xl">
        <h1 className="text-3xl font-semibold text-foreground">Events</h1>
        <p className="mt-2 text-sm text-muted">
          Manage event schedules and attendance activity from the staff workspace.
        </p>
      </div>

      <EventsManagementClient
        initialEvents={[]}
        eventBasePath="/dashboard/staff/events"
      />
    </div>
  );
}
