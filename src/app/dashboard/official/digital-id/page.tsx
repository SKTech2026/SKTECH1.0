import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function OfficialDigitalIdPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.OFFICIAL]);

  const user = await prisma.user.findUnique({
    where: { id: authorizedSession.user.id },
    select: {
      official: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      },
    },
  });

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
        <article className="rounded-2xl border border-glass-border bg-surface p-6 shadow-xl backdrop-blur-md">
          <h3 className="text-2xl font-semibold text-foreground">
            {user.official.firstName} {user.official.lastName}
          </h3>
          <p className="mt-1 text-sm text-muted">{user.official.role}</p>
          <p className="mt-1 text-xs text-muted">
            Official Status: {user.official.status}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/id/${user.official.id}`}
              target="_blank"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              View Digital ID
            </Link>
            <Link
              href={`/id/${user.official.id}`}
              target="_blank"
              className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Download / Print ID
            </Link>
            <Link
              href="/dashboard/official/profile"
              className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Edit Profile for ID
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
