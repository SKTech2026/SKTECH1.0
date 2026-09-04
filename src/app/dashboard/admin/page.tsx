import Link from "next/link";
import { AdmissionStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Clock3,
  MapPinned,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardHomePage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.ADMIN]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    pendingOfficials,
    activeStaff,
    eventCount,
    officialCount,
    todayAttendance,
    totalMunicipalities,
  ] = await Promise.all([
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

  const metrics = [
    {
      label: "Municipalities",
      value: totalMunicipalities,
      tone: "text-cyan-300",
      Icon: MapPinned,
    },
    {
      label: "Pending Officials",
      value: pendingOfficials,
      tone: "text-amber-300",
      Icon: Clock3,
    },
    {
      label: "Approved Staff",
      value: activeStaff,
      tone: "text-accent",
      Icon: UserCog,
    },
    {
      label: "Total Events",
      value: eventCount,
      tone: "text-emerald-300",
      Icon: CalendarDays,
    },
    {
      label: "Registered Officials",
      value: officialCount,
      tone: "text-indigo-300",
      Icon: BadgeCheck,
    },
    {
      label: "Attendance Today",
      value: todayAttendance,
      tone: "text-accent",
      Icon: BarChart3,
    },
  ];

  const modules = [
    {
      href: "/dashboard/admin/staff-admission",
      title: "Staff Admission",
      description: "Create and edit staff profile credentials and access identity.",
      Icon: UserCog,
    },
    {
      href: "/dashboard/admin/municipalities",
      title: "Municipality Governance",
      description: "Create municipalities and assign Municipal Presidents.",
      Icon: MapPinned,
    },
    {
      href: "/dashboard/admin/staff-access",
      title: "Staff Access Approval",
      description: "Review and toggle staff account status for secure operations.",
      Icon: ShieldCheck,
    },
    {
      href: "/dashboard/admin/profiling",
      title: "SK Profiling (CRUD)",
      description: "Manage official records, terms, contacts, and role details.",
      Icon: Users,
    },
    {
      href: "/dashboard/admin/analytics",
      title: "Overall Analytics",
      description: "Inspect event attendance trends and governance performance charts.",
      Icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.25rem] border border-glass-border bg-surface shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md">
        <div className="border-b border-glass-border bg-surface-elevated/40 px-6 py-4 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Provincial Control Room
          </p>
        </div>
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Manage identity governance, access controls, and attendance
              integrity across the provincial federation network.
            </p>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
            Administrator Workspace
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.25rem] border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md transition hover:border-accent/30 hover:bg-surface-elevated/60"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {metric.label}
              </p>
              <span className="rounded-lg border border-glass-border bg-surface-elevated/70 p-2 text-muted">
                <metric.Icon className="h-4 w-4" />
              </span>
            </div>
            <p className={`mt-4 text-3xl font-bold tracking-tight ${metric.tone}`}>
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group rounded-[1.25rem] border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-elevated"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-xl border border-glass-border bg-surface-elevated/70 p-2 text-accent">
                <module.Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {module.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">{module.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
