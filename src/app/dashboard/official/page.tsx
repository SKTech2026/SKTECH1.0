import Link from "next/link";
import { AdmissionStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardList,
  IdCard,
  Megaphone,
  MessageSquare,
  Settings2,
  UserCheck,
  UserCog,
} from "lucide-react";

import FlippablePortraitID from "@/components/id/FlippablePortraitID";
import { authOptions } from "@/lib/auth";
import { getActiveAnnouncements } from "@/lib/announcements";
import { prisma } from "@/lib/db";
import { requireDashboardRole } from "@/lib/roleGuard";
import { formatEnumLabel, formatOfficialFullName } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

export default async function OfficialDashboardHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const accessParam = resolvedSearchParams.access;
  const admissionRequired =
    (Array.isArray(accessParam) ? accessParam[0] : accessParam) ===
    "admission_required";

  const currentUser = await prisma.user.findUnique({
    where: { id: authorizedSession.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      image: true,
      official: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          role: true,
          position: true,
          skFederationOfficer: true,
          skFederationPosition: true,
          municipality: true,
          barangay: true,
          sitio: true,
          dateElected: true,
          termStart: true,
          status: true,
          admissionStatus: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!currentUser) {
    redirect("/official/auth");
  }

  if (currentUser.status !== UserStatus.APPROVED) {
    const profileStatus = currentUser.official?.admissionStatus ?? AdmissionStatus.PENDING;
    const waitingForApproval = profileStatus === AdmissionStatus.PENDING;
    const rejected = profileStatus === AdmissionStatus.REJECTED;

    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#1452d9]/25 bg-surface p-6 shadow-[0_28px_70px_-32px_var(--shadow-color)] backdrop-blur-xl sm:p-9">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#1452d9]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-[#cf2638]/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">SKTECH Official Portal</p>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                <UserCheck className="h-3.5 w-3.5" /> {profileStatus}
              </span>
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {rejected ? "Let's refresh your admission." : waitingForApproval && currentUser.official?.updatedAt ? "Your credentials are in review." : "Build your verified official profile."}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              {rejected
                ? "Review the reason and resubmit your official details for Municipal Staff review."
                : waitingForApproval && currentUser.official?.updatedAt
                  ? "Your Municipal SK Federation Staff is reviewing the submitted details. Approved dashboard features unlock after review."
                  : "Complete the SKTECH admission flow with your official information and supporting credentials before accessing dashboard features."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/official/admission" className="inline-flex items-center gap-2 rounded-xl bg-[#1452d9] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_#1452d9] transition hover:bg-[#0f43b5]">
                {rejected ? "Review Admission" : "Complete Admission"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              {admissionRequired ? <span className="inline-flex items-center rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-100">Features unlock after Staff approval</span> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="glass-card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Admission status</p>
            <p className="mt-2 text-2xl font-black text-amber-200">{profileStatus}</p>
            <p className="mt-2 text-xs text-muted">Staff review keeps your access protected.</p>
          </article>
          <article className="glass-card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Profile readiness</p>
            <p className="mt-2 text-2xl font-black text-accent">{currentUser.official?.updatedAt ? "Submitted" : "Not started"}</p>
            <p className="mt-2 text-xs text-muted">Personal and SK details are submitted through the admission form.</p>
          </article>
          <article className="glass-card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Next step</p>
            <p className="mt-2 text-2xl font-black text-[#cf2638]">{waitingForApproval ? "Wait" : "Submit"}</p>
            <p className="mt-2 text-xs text-muted">Your official workspace remains locked until approval.</p>
          </article>
        </section>
      </div>
    );
  }

  const [attendanceCount, bulletinItems] = await Promise.all([
    currentUser.official
      ? prisma.officialAttendance.count({
          where: {
            officialId: currentUser.official.id,
          },
        })
      : Promise.resolve(0),
    getActiveAnnouncements(3),
  ]);
  const photoUrl =
    currentUser.image && currentUser.image.startsWith("/")
      ? currentUser.image
      : "/images/default-official.svg";

  const quickAccess = [
    ["Digital ID", "Open your landscape credential", "/dashboard/official/digital-id", IdCard, "bg-[#1452d9]/15 text-[#6ea0ff]"],
    ["Admission / Profile", "Manage approved details", "/dashboard/official/profile", UserCog, "bg-[#cf2638]/15 text-[#ff8a95]"],
    ["Announcements", "Read federation advisories", "/dashboard/official/announcements", Megaphone, "bg-[#f3c72b]/15 text-[#e7b720]"],
    ["Municipal SK Federation Feed", "Read Staff posts for your municipality", "/dashboard/official/feed", Megaphone, "bg-[#1452d9]/15 text-[#6ea0ff]"],
    ["Attendance", "Review your participation", "/dashboard/official/attendance", ClipboardList, "bg-[#1452d9]/15 text-[#6ea0ff]"],
    ["Chat", "Message your municipality", "/dashboard/official/chat", MessageSquare, "bg-[#cf2638]/15 text-[#ff8a95]"],
    ["Settings", "Theme and account preferences", "/dashboard/official/settings", Settings2, "bg-[#f3c72b]/15 text-[#e7b720]"],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#1452d9]/25 bg-surface p-6 shadow-[0_28px_70px_-32px_var(--shadow-color)] backdrop-blur-xl sm:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#1452d9]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#cf2638]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              <BadgeCheck className="h-4 w-4" /> Official Access
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              Welcome, {currentUser.name ?? currentUser.email}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Your SKTECH workspace for verified identity, local coordination, attendance, and federation updates.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" /> Account approved
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Account Status</p>
          <p className="mt-2 text-2xl font-black text-accent">{currentUser.status}</p>
        </article>
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Official Role</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{currentUser.official?.role ?? "Unassigned"}</p>
        </article>
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Attendance Logs</p>
          <p className="mt-2 text-2xl font-black text-[#e7b720]">{attendanceCount}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.85fr)] xl:items-start">
        {currentUser.official ? (
          <article className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[#1452d9]/20 bg-surface p-4 shadow-[0_24px_55px_-28px_var(--shadow-color)] backdrop-blur-xl sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Digital ID</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {formatOfficialFullName(currentUser.official)}
                </h3>
              </div>
              <Link href={`/id/${currentUser.official.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70">
                Full Page <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <FlippablePortraitID
              fullName={formatOfficialFullName(currentUser.official)}
              position={formatEnumLabel(currentUser.official.position ?? currentUser.official.role)}
              skfedPosition={
                currentUser.official.skFederationOfficer
                  ? formatEnumLabel(currentUser.official.skFederationPosition)
                  : null
              }
              barangay={currentUser.official.barangay ?? "Not specified"}
              municipality={currentUser.official.municipality ?? "Not specified"}
              sitio={currentUser.official.sitio}
              dateElected={(currentUser.official.dateElected ?? currentUser.official.termStart).toISOString()}
              idNumber={currentUser.official.id.replace(/-/g, "").slice(-12).toUpperCase()}
              qrValue={`/id/${currentUser.official.id}`}
              photoUrl={photoUrl}
              registryStatus={currentUser.official.status}
              sktechLogoUrl="/assets/logos/sktech-logo-new.png"
              provincialSealUrl="/assets/logos/official-seal-logo-new.png"
              skfedLogoUrl="/assets/logos/sk-logo-new.png"
            />
          </article>
        ) : null}

        <div className="grid gap-4">
          <article className="rounded-[1.5rem] border border-[#cf2638]/20 bg-surface p-5 shadow-[0_24px_55px_-28px_var(--shadow-color)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Workspace</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Quick Access</h3>
              </div>
              <Link
                href="/dashboard/official/settings"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Settings
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {quickAccess.map(([label, description, href, Icon, colorClass]) => (
                <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-glass-border bg-surface-elevated/35 p-3 transition hover:-translate-y-0.5 hover:border-accent/35 hover:bg-surface-elevated/70">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colorClass}`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-0.5 block text-xs text-muted">{description}</span></span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </article>

          <article id="announcements" className="scroll-mt-6 rounded-[1.5rem] border border-[#f3c72b]/20 bg-surface p-5 shadow-[0_24px_55px_-28px_var(--shadow-color)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-foreground">Active Announcements</h3>
          <ul className="mt-4 space-y-3">
            {bulletinItems.length === 0 ? (
              <li className="text-sm text-muted">No announcements published yet.</li>
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
        </div>
      </section>
    </div>
  );
}
