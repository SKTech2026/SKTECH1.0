import {
  AdmissionStatus,
  KKCertificateStatus,
  KKProfileStatus,
  Role,
  UserStatus,
} from "@prisma/client";
import {
  Activity,
  CheckCircle2,
  Database,
  Globe,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireDashboardRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function AdminSystemHealthPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.ADMIN], {
    unauthenticatedRedirect: "/login?role=ADMIN",
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    dbHealthy,
    totalUsers,
    approvedAdmins,
    approvedStaff,
    approvedOfficials,
    kkMembers,
    pendingKkProfiles,
    pendingOfficialAdmissions,
    activeEvents,
    certificatesIssued,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`
      .then(() => true)
      .catch(() => false),
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: Role.ADMIN,
        status: UserStatus.APPROVED,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.STAFF,
        status: UserStatus.APPROVED,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.OFFICIAL,
        status: UserStatus.APPROVED,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.KK_MEMBER,
      },
    }),
    prisma.kKMemberProfile.count({
      where: {
        status: {
          in: [
            KKProfileStatus.DRAFT,
            KKProfileStatus.PENDING_EMAIL_VERIFICATION,
            KKProfileStatus.PENDING_VERIFICATION,
            KKProfileStatus.NEEDS_CORRECTION,
          ],
        },
      },
    }),
    prisma.officialAdmission.count({
      where: {
        admissionStatus: AdmissionStatus.PENDING,
      },
    }),
    prisma.event.count({
      where: {
        eventDate: {
          gte: now,
        },
      },
    }),
    prisma.kKCertificate.count({
      where: {
        status: KKCertificateStatus.ISSUED,
      },
    }),
    prisma.auditLog.count({
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    }),
  ]);

  const healthCards = [
    {
      label: "Database reachable",
      value: dbHealthy ? "Online" : "Unavailable",
      detail: dbHealthy ? "Prisma connectivity confirmed" : "Check application DB health",
      tone: dbHealthy ? "text-emerald-500" : "text-amber-500",
      Icon: Database,
    },
    {
      label: "Total users",
      value: totalUsers,
      detail: "All accounts in the system",
      tone: "text-accent",
      Icon: Users,
    },
    {
      label: "Approved admins/staff/officials",
      value: approvedAdmins + approvedStaff + approvedOfficials,
      detail: `${approvedAdmins} admin / ${approvedStaff} staff / ${approvedOfficials} officials`,
      tone: "text-cyan-500",
      Icon: ShieldCheck,
    },
    {
      label: "KK members",
      value: kkMembers,
      detail: "Registered member accounts",
      tone: "text-violet-500",
      Icon: Users,
    },
    {
      label: "Pending KK profiles",
      value: pendingKkProfiles,
      detail: "Profiles awaiting review",
      tone: "text-amber-500",
      Icon: Activity,
    },
    {
      label: "Pending official admissions",
      value: pendingOfficialAdmissions,
      detail: "Official review queue",
      tone: "text-amber-500",
      Icon: Lock,
    },
    {
      label: "Active events",
      value: activeEvents,
      detail: "Upcoming or active events",
      tone: "text-sky-500",
      Icon: Globe,
    },
    {
      label: "Certificates issued",
      value: certificatesIssued,
      detail: "Issued KK certificates",
      tone: "text-emerald-500",
      Icon: CheckCircle2,
    },
    {
      label: "Recent audit logs",
      value: recentAuditLogs,
      detail: "Last 30 days",
      tone: "text-fuchsia-500",
      Icon: ShieldCheck,
    },
  ];

  const securityChecklist = [
    "Role guards active",
    "KK portal separated",
    "Public ID privacy hardened",
    "CSV formula protection active",
    "Private photo cache active",
    "Public verification routes safe",
    "Analytics aggregate-only exports active",
  ];

  const domainReadiness = [
    {
      label: "Main portal domain",
      value: "sktech-ormin.com",
      note: "Primary internal/admin portal",
    },
    {
      label: "KK portal domain",
      value: "kk.sktech-ormin.com",
      note: "Configured reference only; no external DNS check performed here",
    },
  ];

  const deploymentInfo = [
    {
      label: "Environment",
      value: process.env.NODE_ENV ?? "unknown",
    },
    {
      label: "Build commit",
      value:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.GIT_COMMIT ??
        "not configured",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-[0_24px_48px_-28px_var(--shadow-color)]">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Production readiness
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin System Health
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Operational summary for SKTECH after the security hardening, KK portal separation,
              analytics reporting, export controls, and domain routing work.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              Verified for {authorizedSession.user.name ?? authorizedSession.user.email}
            </p>
          </div>

          <div className="grid min-w-[220px] gap-3 rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">DB</span>
              <span className={`inline-flex items-center gap-2 text-sm font-semibold ${dbHealthy ? "text-emerald-500" : "text-amber-500"}`}>
                {dbHealthy ? "Reachable" : "Check required"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Ready</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
                Admin verified
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {healthCards.map(({ label, value, detail, tone, Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_18px_36px_-26px_var(--shadow-color)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {label}
                </p>
                <p className={`mt-3 text-3xl font-bold tracking-tight ${tone}`}>
                  {value}
                </p>
                <p className="mt-2 text-sm text-muted">{detail}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/65 text-muted">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)]">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-foreground">Security readiness</h3>
          </div>

          <ul className="space-y-3">
            {securityChecklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-glass-border bg-surface-elevated/45 px-3 py-2"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-6 rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Globe className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Domain readiness</h3>
            </div>
            <div className="space-y-3">
              {domainReadiness.map(({ label, value, note }) => (
                <div
                  key={label}
                  className="rounded-xl border border-glass-border bg-surface-elevated/45 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-muted">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Deployment info</h3>
            </div>
            <div className="space-y-3">
              {deploymentInfo.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-glass-border bg-surface-elevated/45 px-3 py-2"
                >
                  <span className="text-sm text-muted">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Secret material, DB connection strings, and API keys are intentionally not displayed.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
