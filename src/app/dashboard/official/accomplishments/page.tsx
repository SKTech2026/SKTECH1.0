import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function OfficialAccomplishmentsPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);

  const [eventCount, attendanceCount, registeredOfficials, latestEvents] = await Promise.all([
    prisma.event.count(),
    prisma.officialAttendance.count(),
    prisma.user.count({
      where: {
        role: Role.OFFICIAL,
        status: UserStatus.APPROVED,
      },
    }),
    prisma.event.findMany({
      orderBy: { eventDate: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        eventDate: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Federation Progress
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          SK Provincial Federation Accomplishments
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          High-level accomplishments and participation indicators across the federation.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Provincial Events", value: eventCount, tone: "text-accent" },
          { label: "Recorded Attendance", value: attendanceCount, tone: "text-emerald-300" },
          { label: "Approved Officials", value: registeredOfficials, tone: "text-indigo-300" },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              {metric.label}
            </p>
            <p className={`mt-2 text-3xl font-bold ${metric.tone}`}>{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-foreground">Recent Federation Milestones</h3>
        <ul className="mt-4 space-y-3">
          {latestEvents.length === 0 ? (
            <li className="text-sm text-muted">No milestones recorded yet.</li>
          ) : (
            latestEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-glass-border bg-surface/45 px-4 py-3"
              >
                <p className="text-sm font-semibold text-foreground">{event.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {event.eventDate.toLocaleDateString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
