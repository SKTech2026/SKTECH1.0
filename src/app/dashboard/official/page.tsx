import Link from "next/link";
import { AdmissionStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

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
        <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Official Admission Required
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {rejected
              ? "Admission Requires Resubmission"
              : waitingForApproval && currentUser.official?.updatedAt
                ? "Admission Under Review"
                : "Official Admission Required"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            {rejected
              ? "Your Official Admission was rejected. Please review the status below and resubmit your admission details according to the existing workflow."
              : waitingForApproval && currentUser.official?.updatedAt
                ? "Your Official Admission has been submitted and is currently under review by your Municipal SK Federation Staff. You will receive an email notification once your account is approved."
                : "You cannot access this section yet. Please submit your Official Admission first and wait for approval from your Municipal SK Federation Staff before accessing dashboard features."}
          </p>
          {admissionRequired ? (
            <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Full dashboard features unlock after your Official Admission is approved.
            </p>
          ) : null}
          {rejected ? (
            <p className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Current status: Rejected. Please update and resubmit your admission details.
            </p>
          ) : null}
          {!rejected && !currentUser.official?.updatedAt ? (
            <p className="mt-3 rounded-xl border border-sky-300/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              Start with the admission form so your Municipal SK Federation Staff can review your record.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/official/admission"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Submit Admission Details
            </Link>
            <span
              className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                waitingForApproval
                  ? "bg-amber-500/20 text-amber-200"
                  : profileStatus === AdmissionStatus.REJECTED
                    ? "bg-rose-500/20 text-rose-200"
                    : "bg-surface-elevated text-foreground"
              }`}
            >
              Current Status: {profileStatus}
            </span>
          </div>
          {currentUser.official?.updatedAt ? (
            <p className="mt-3 text-xs text-muted">
              Last submission: {new Date(currentUser.official.updatedAt).toLocaleString()}
            </p>
          ) : null}
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Official Access
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          Welcome, {currentUser.name ?? currentUser.email}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Access verified public announcements, your digital ID, attendance logs, and
          provincial federation accomplishments.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Account Status</p>
          <p className="mt-2 text-2xl font-bold text-accent">{currentUser.status}</p>
        </article>
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Official Role</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {currentUser.official?.role ?? "Unassigned"}
          </p>
        </article>
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Attendance Logs</p>
          <p className="mt-2 text-2xl font-bold text-indigo-300">{attendanceCount}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {currentUser.official ? (
          <article className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Digital ID</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {formatOfficialFullName(currentUser.official)}
                </h3>
              </div>
              <Link
                href={`/id/${currentUser.official.id}`}
                target="_blank"
                className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
              >
                Full Page
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
              sktechLogoUrl="/sk-tech-logo.png"
              provincialSealUrl="/images/provincial-seal-logo.png"
              skfedLogoUrl="/login-logo.png"
            />
          </article>
        ) : null}

        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-semibold text-foreground">Quick Access</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/official/digital-id"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Open Digital ID
            </Link>
            <Link
              href="/dashboard/official/profile"
              className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Edit Profile
            </Link>
            <Link
              href="/dashboard/official/attendance"
              className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              View Attendance Logs
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
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
      </section>
    </div>
  );
}
