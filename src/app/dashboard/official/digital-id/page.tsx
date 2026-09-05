import Link from "next/link";
import { getServerSession } from "next-auth";

import FlippablePortraitID from "@/components/id/FlippablePortraitID";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";
import { formatEnumLabel, formatOfficialFullName } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

export default async function OfficialDigitalIdPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = await requireOfficialFeatureAccess(session);

  const user = await prisma.user.findUnique({
    where: { id: authorizedSession.user.id },
    select: {
      official: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          position: true,
          skFederationOfficer: true,
          skFederationPosition: true,
          municipality: true,
          barangay: true,
          sitio: true,
          dateElected: true,
          termStart: true,
          status: true,
        },
      },
      image: true,
    },
  });
  const photoUrl =
    user?.image && user.image.startsWith("/") ? user.image : "/images/default-official.svg";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Identity Wallet
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Digital ID Access</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          View and download your federation-issued digital identity card.
        </p>
      </section>

      {!user?.official ? (
        <article className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          No linked SK official record is available yet. Please contact staff for identity
          assignment.
        </article>
      ) : (
        <article className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div>
              <h3 className="text-2xl font-semibold text-foreground">
                {formatOfficialFullName(user.official)}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {formatEnumLabel(user.official.position)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {user.official.barangay ?? "Not specified"} |{" "}
                {user.official.municipality ?? "Not specified"}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/id/${user.official.id}`}
                  target="_blank"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
                >
                  Open Full Page ID
                </Link>
                <Link
                  href="/dashboard/official/profile"
                  className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
                >
                  Edit Profile for ID
                </Link>
              </div>
            </div>

            <FlippablePortraitID
              fullName={formatOfficialFullName(user.official)}
              position={formatEnumLabel(user.official.position)}
              skfedPosition={
                user.official.skFederationOfficer
                  ? formatEnumLabel(user.official.skFederationPosition)
                  : null
              }
              barangay={user.official.barangay ?? "Not specified"}
              municipality={user.official.municipality ?? "Not specified"}
              sitio={user.official.sitio}
              dateElected={(user.official.dateElected ?? user.official.termStart).toISOString()}
              idNumber={user.official.id.replace(/-/g, "").slice(-12).toUpperCase()}
              qrValue={`/id/${user.official.id}`}
              photoUrl={photoUrl}
              registryStatus={user.official.status}
              sktechLogoUrl="/sk-tech-logo.png"
              provincialSealUrl="/images/provincial-seal-logo.png"
              skfedLogoUrl="/login-logo.png"
            />
          </div>
        </article>
      )}
    </div>
  );
}
