import Link from "next/link";
import { AdmissionStatus, OfficialStatus, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { Activity, BadgeCheck, ClipboardList, Megaphone } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getActiveAnnouncements } from "@/lib/announcements";
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
        <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
          <div className="border-b border-glass-border bg-surface-elevated/60 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Municipal Operations
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Your staff account is active, but no municipality has been assigned yet. Contact your
              administrator to complete assignment before managing SK official admissions.
            </p>
          </div>
          <div className="p-6">
            <div className="rounded-xl border border-glass-border bg-surface-elevated/55 px-4 py-3 text-sm text-muted">
              <span className="font-semibold text-foreground">Status:</span> Awaiting municipality assignment.
            </div>
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
      getActiveAnnouncements(3),
      prisma.municipality.findUnique({
        where: { id: staffMunicipalityId },
        select: {
          id: true,
          name: true,
          province: true,
        },
      }),
    ]);

  const metrics = [
    {
      label: "Pending Admissions",
      value: pendingAdmissions,
      helper: "Awaiting staff review",
      icon: ClipboardList,
    },
    {
      label: "Approved Officials",
      value: activeOfficials,
      helper: "Active municipal records",
      icon: BadgeCheck,
    },
    {
      label: "Attendance Today",
      value: attendanceToday,
      helper: "Verified check-ins",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        <div className="grid gap-5 border-b border-glass-border bg-surface-elevated/60 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Municipal Operations
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Welcome, {authorizedSession.user.name ?? authorizedSession.user.email}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Process official admissions, maintain attendance visibility, and keep the
              public bulletin up to date.
            </p>
          </div>
          <div className="rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm shadow-[0_16px_36px_-28px_var(--shadow-color)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Assigned Municipality
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {municipality ? `${municipality.name}, ${municipality.province}` : "Unknown"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
          <article
            key={metric.label}
            className="rounded-xl border border-glass-border bg-surface-elevated/80 p-5 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{metric.value}</p>
                <p className="mt-1 text-sm text-muted">{metric.helper}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 text-accent">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-glass-border bg-surface-elevated/80 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Next Steps
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">Priority Actions</h3>
            </div>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Staff
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              {
                href: "/dashboard/staff/admissions",
                label: "Review Admission Queue",
                description: "Validate pending SK official submissions.",
              },
              {
                href: "/dashboard/staff/attendance-monitoring",
                label: "Open Attendance Monitoring",
                description: "Watch recent check-ins for your municipality.",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-xl border border-glass-border bg-surface/55 px-4 py-3 transition hover:border-accent/35 hover:bg-accent/10"
              >
                <p className="text-sm font-semibold text-foreground group-hover:text-accent">
                  {action.label}
                </p>
                <p className="mt-1 text-xs text-muted">{action.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-glass-border bg-surface-elevated/80 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Bulletin
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">Active Announcement Feed</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-surface text-accent">
              <Megaphone className="h-4 w-4" />
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {bulletinItems.length === 0 ? (
              <li className="rounded-xl border border-dashed border-glass-border bg-surface/45 px-4 py-6 text-center text-sm text-muted">
                No announcements available.
              </li>
            ) : (
              bulletinItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-glass-border bg-surface/55 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                      Active
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
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
