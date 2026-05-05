import Link from "next/link";
import { AdmissionStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardHomePage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.ADMIN]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pendingOfficials, activeStaff, eventCount, officialCount, todayAttendance, totalMunicipalities] =
    await Promise.all([
      prisma.user.count({
        where: {
          role: Role.OFFICIAL,
          official: {
            admissionStatus: AdmissionStatus.PENDING,
          },
        },
      }),
      prisma.user.count({
        where: {
          role: Role.STAFF,
          status: UserStatus.APPROVED,
        },
      }),
      prisma.event.count(),
      prisma.sKOfficial.count(),
      prisma.officialAttendance.count({
        where: {
          timeIn: {
            gte: startOfToday,
          },
        },
      }),
      prisma.municipality.count(),
    ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Provincial Control Room
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Manage identity governance, access controls, and attendance integrity across
          the provincial federation network.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Municipalities", value: totalMunicipalities, tone: "text-cyan-300" },
          { label: "Pending Officials", value: pendingOfficials, tone: "text-amber-300" },
          { label: "Approved Staff", value: activeStaff, tone: "text-accent" },
          { label: "Total Events", value: eventCount, tone: "text-emerald-300" },
          { label: "Registered Officials", value: officialCount, tone: "text-indigo-300" },
          { label: "Attendance Today", value: todayAttendance, tone: "text-accent" },
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            href: "/dashboard/admin/staff-admission",
            title: "Staff Admission",
            description: "Create and edit staff profile credentials and access identity.",
          },
          {
            href: "/dashboard/admin/municipalities",
            title: "Municipality Governance",
            description: "Create municipalities and assign Municipal Presidents.",
          },
          {
            href: "/dashboard/admin/staff-access",
            title: "Staff Access Approval",
            description: "Review and toggle staff account status for secure operations.",
          },
          {
            href: "/dashboard/admin/profiling",
            title: "SK Profiling (CRUD)",
            description: "Manage official records, terms, contacts, and role details.",
          },
          {
            href: "/dashboard/admin/analytics",
            title: "Overall Analytics",
            description: "Inspect event attendance trends and governance performance charts.",
          },
        ].map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-2xl border border-glass-border bg-surface p-5 transition hover:border-accent/40 hover:bg-surface-elevated"
          >
            <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
            <p className="mt-2 text-sm text-muted">{module.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
