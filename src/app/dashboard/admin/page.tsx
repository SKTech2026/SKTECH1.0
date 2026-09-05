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
      tone: "text-accent",
      Icon: MapPinned,
    },
    {
      label: "Pending Officials",
      value: pendingOfficials,
      tone: "text-accent",
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
      tone: "text-accent",
      Icon: CalendarDays,
    },
    {
      label: "Registered Officials",
      value: officialCount,
      tone: "text-accent",
      Icon: BadgeCheck,
    },
    {
      label: "Attendance Today",
      value: todayAttendance,
      tone: "text-accent",
      Icon: BarChart3,
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/admin/staff-admission",
      title: "Review Staff Admission",
      description: "Create and update staff profile access.",
      Icon: UserCog,
    },
    {
      href: "/dashboard/admin/profiling",
      title: "Manage Officials",
      description: "Maintain SK official profile records.",
      Icon: Users,
    },
    {
      href: "/dashboard/admin/municipalities",
      title: "Manage Municipalities",
      description: "Set municipality records and assignments.",
      Icon: MapPinned,
    },
    {
      href: "/dashboard/admin/analytics",
      title: "View Analytics",
      description: "Review province-wide operational reports.",
      Icon: BarChart3,
    },
    {
      href: "/dashboard/admin/events",
      title: "Event Management",
      description: "Coordinate official SKTECH events.",
      Icon: CalendarDays,
    },
    {
      href: "/dashboard/admin/id-production",
      title: "ID Production",
      description: "Generate and verify official credentials.",
      Icon: BadgeCheck,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-[0_24px_48px_-28px_var(--shadow-color)]">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Administrator Workspace
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Provincial Administration Dashboard
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Monitor SK governance operations, official admissions, events,
              identity services, and municipal performance across Oriental
              Mindoro.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
            </p>
          </div>

          <div className="grid min-w-[220px] grid-cols-2 gap-3 rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
            <div>
              <p className="text-xs text-muted">Operations</p>
              <p className="mt-1 text-xl font-bold text-foreground">{eventCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Attendance</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {todayAttendance}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_18px_36px_-26px_var(--shadow-color)] transition hover:border-accent/30 hover:bg-surface-elevated/55"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {metric.label}
                </p>
                <p className={`mt-3 text-3xl font-bold tracking-tight ${metric.tone}`}>
                  {metric.value}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/65 text-muted">
                <metric.Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)] xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Governance Snapshot
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Municipality and access coverage
              </h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-glass-border bg-surface-elevated/45 px-4 py-3">
              <span className="text-sm text-muted">Municipalities tracked</span>
              <span className="text-lg font-bold text-foreground">
                {totalMunicipalities}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-glass-border bg-surface-elevated/45 px-4 py-3">
              <span className="text-sm text-muted">Approved staff accounts</span>
              <span className="text-lg font-bold text-foreground">{activeStaff}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-glass-border bg-surface-elevated/45 px-4 py-3">
              <span className="text-sm text-muted">Registered officials</span>
              <span className="text-lg font-bold text-foreground">
                {officialCount}
              </span>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)] xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Operations Snapshot
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Events and identity activity
              </h3>
            </div>
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-glass-border bg-surface-elevated/45 p-4">
              <p className="text-xs text-muted">Total events</p>
              <p className="mt-3 text-3xl font-bold text-accent">
                {eventCount}
              </p>
            </div>
            <div className="rounded-xl border border-glass-border bg-surface-elevated/45 p-4">
              <p className="text-xs text-muted">Attendance today</p>
              <p className="mt-3 text-3xl font-bold text-accent">
                {todayAttendance}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-foreground">
            {pendingOfficials > 0
              ? `${pendingOfficials} Official admission(s) currently require review by municipal staff.`
              : "No Official admissions are currently pending municipal staff review."}
          </div>
        </article>

        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)] xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Quick Management
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Administrative shortcuts
              </h3>
            </div>
            <ArrowUpRight className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-5 grid gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl border border-glass-border bg-surface-elevated/35 px-3 py-3 transition hover:border-accent/35 hover:bg-accent/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-glass-border bg-surface/70 text-accent">
                  <link.Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {link.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {link.description}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
