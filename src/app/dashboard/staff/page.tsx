import Link from "next/link";
import { AdmissionStatus, OfficialStatus, Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function StaffDashboardHomePage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.STAFF]);
  const staffMunicipalityId = authorizedSession.user.municipalityPresidentId;

  if (!staffMunicipalityId) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Staff Operations Deck
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Your staff account is active, but no municipality has been assigned yet. Contact your
            administrator to complete assignment before managing SK official admissions.
          </p>
          <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Status: Awaiting municipality assignment.
          </div>
        </section>
      </div>
    );
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pendingAdmissions, activeOfficials, attendanceToday, bulletinItems, municipality] =
    await Promise.all([
      prisma.sKOfficial.count({
        where: {
          municipalityId: staffMunicipalityId,
          admissionStatus: AdmissionStatus.PENDING,
        },
      }),
      prisma.sKOfficial.count({
        where: {
          municipalityId: staffMunicipalityId,
          admissionStatus: AdmissionStatus.APPROVED,
          status: OfficialStatus.ACTIVE,
        },
      }),
      prisma.officialAttendance.count({
        where: {
          official: {
            user: {
              municipalityOfficerId: staffMunicipalityId,
            },
          },
          timeIn: {
            gte: startOfToday,
          },
        },
      }),
      prisma.event.findMany({
        orderBy: { eventDate: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          eventDate: true,
          description: true,
        },
      }),
      prisma.municipality.findUnique({
        where: { id: staffMunicipalityId },
        select: {
          id: true,
          name: true,
          province: true,
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Staff Operations Deck
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Process official admissions, maintain attendance visibility, and keep the
          public bulletin up to date.
        </p>
        <p className="mt-2 inline-flex rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
          Assigned Municipality: {municipality ? `${municipality.name}, ${municipality.province}` : "Unknown"}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending Admissions", value: pendingAdmissions, tone: "text-amber-300" },
          { label: "Approved Officials", value: activeOfficials, tone: "text-accent" },
          { label: "Attendance Today", value: attendanceToday, tone: "text-emerald-300" },
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

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-semibold text-foreground">Priority Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/staff/admissions"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Review Admission Queue
            </Link>
            <Link
              href="/dashboard/staff/attendance-monitoring"
              className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Open Attendance Monitoring
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-semibold text-foreground">Public Announcement Feed</h3>
          <ul className="mt-4 space-y-3">
            {bulletinItems.length === 0 ? (
              <li className="text-sm text-muted">No announcements available.</li>
            ) : (
              bulletinItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-glass-border bg-surface/45 p-3">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(item.eventDate).toLocaleDateString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
