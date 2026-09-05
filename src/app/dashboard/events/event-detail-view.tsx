import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const formatDateTime = (value: Date | null) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
};

type EventDetailViewProps = {
  id: string;
  eventBasePath?: string;
};

export default async function EventDetailView({
  id,
  eventBasePath = "/dashboard/events",
}: EventDetailViewProps) {
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      _count: {
        select: {
          officialAttendances: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const attendanceRecords = await prisma.officialAttendance.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
    include: {
      official: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-glass-border bg-surface-elevated p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Event Details
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {event.description || "No event description provided."}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={eventBasePath}
              className="rounded-md border border-glass-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated/70"
            >
              Back to Events
            </Link>
            <a
              href={`/api/attendance/export?eventId=${encodeURIComponent(event.id)}`}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              Export CSV
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Date</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDateTime(event.eventDate)}
            </p>
          </div>
          <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
            <p className="text-xs uppercase tracking-wide text-muted">
              Total Attendance
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {event._count.officialAttendances}
            </p>
          </div>
          <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {attendanceRecords.some((record) => record.timeOut === null)
                ? "Open Attendance"
                : "Completed Attendance"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-surface-elevated shadow-xl">
        <div className="border-b border-glass-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Attendance Records</h2>
          <p className="mt-1 text-sm text-muted">
            Official attendance history for this event.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-foreground">
            <thead className="bg-surface-elevated">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Time In</th>
                <th className="px-6 py-3 font-medium">Time Out</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted">
                    No attendance records for this event.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-elevated/60">
                    <td className="px-6 py-4 text-foreground">
                      {record.official.firstName} {record.official.lastName}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {formatDateTime(record.timeIn)}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {formatDateTime(record.timeOut)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          record.timeOut === null
                            ? "bg-emerald-700/30 text-emerald-200"
                            : "bg-surface-elevated/70 text-foreground"
                        }`}
                      >
                        {record.timeOut === null ? "Checked In" : "Checked Out"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
