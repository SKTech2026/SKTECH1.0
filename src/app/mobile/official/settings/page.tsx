import Link from "next/link";
import Image from "next/image";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import AppearanceSelector from "./appearance-selector";
import LogoutButton from "./logout-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireDashboardRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialSettingsPage() {
  const session = await getServerSession(authOptions);
  const authorized = requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });
  const user = await prisma.user.findUnique({
    where: { id: authorized.user.id },
    select: {
      name: true,
      email: true,
      status: true,
      image: true,
      official: {
        select: {
          municipality: true,
          barangay: true,
        },
      },
    },
  });
  const pendingRequest = await prisma.officialProfileChangeRequest.findFirst({
    where: { requestedByUserId: authorized.user.id, status: "PENDING" },
    select: { createdAt: true },
  });
  const photoUrl = user?.image?.startsWith("/") ? user.image : "/images/default-official.svg";

  return (
    <div className="space-y-4">
      <Link href="/mobile/official" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <header className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Official Mobile</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Mobile Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your SKTECH mobile account preferences.</p>
      </header>

      <section className="rounded-2xl border border-glass-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">Account Management</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">Name</dt><dd className="text-right font-medium text-foreground">{user?.name ?? "Not provided"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Email</dt><dd className="text-right font-medium text-foreground">{user?.email ?? "Not provided"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Role / status</dt><dd className="text-right font-medium text-foreground">Official / {user?.status ?? "Not recorded"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Municipality</dt><dd className="text-right font-medium text-foreground">{user?.official?.municipality ?? "Not recorded"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Barangay</dt><dd className="text-right font-medium text-foreground">{user?.official?.barangay ?? "Not recorded"}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">Profile Management</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-16 w-14 overflow-hidden rounded-lg border border-glass-border bg-surface-elevated">
            <Image src={photoUrl} alt="Current approved profile" fill className="object-cover" sizes="56px" unoptimized={photoUrl.startsWith("/api/official/photo")} />
          </div>
          <p className="text-xs text-muted">Current approved profile photo</p>
        </div>
        <p className="mt-2 text-sm text-muted">Profile and photo changes require Municipal Staff approval before appearing on your Digital ID.</p>
        {pendingRequest ? <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">A profile update is awaiting Staff review. Your approved Digital ID data remains active.</p> : null}
        <Link href="/dashboard/official/profile" className="mt-3 inline-flex rounded-xl border border-glass-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-elevated">Manage Profile</Link>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Choose how SKTECH looks on this device.</p>
        <div className="mt-3"><AppearanceSelector /></div>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">About SKTECH</h2>
        <p className="mt-2 text-sm font-semibold text-foreground">SKTECH – Integrated E-Governance System</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">A capstone digital governance platform for SK admissions, identity, attendance, announcements, and municipal operations.</p>
      </section>

      <LogoutButton />
    </div>
  );
}
