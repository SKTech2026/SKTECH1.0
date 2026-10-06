import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";
import YouthPassCard from "@/components/kk/YouthPassCard";

export const dynamic = "force-dynamic";

const pendingStatuses = new Set([
  "DRAFT",
  "PENDING_EMAIL_VERIFICATION",
  "PENDING_VERIFICATION",
  "NEEDS_CORRECTION",
]);

export default async function KKYouthPassPage() {
  const member = await getKKUser();
  if (!member) redirect("/kk/login");

  const profile = await prisma.kKMemberProfile.findUnique({
    where: { userId: member.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      youthClassification: true,
      youthAgeGroup: true,
      createdAt: true,
      province: true,
      municipality: { select: { name: true } },
      barangay: { select: { name: true } },
    },
  });

  if (!profile) {
    return (
      <section className="rounded-3xl border border-dashed border-sky-200 bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK YouthPass</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Activate your digital ID</h1>
        <p className="mt-3 max-w-2xl text-muted">Complete your KK Survey / Profiling to activate your YouthPass.</p>
        <Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
          KK Survey / Profiling
        </Link>
      </section>
    );
  }

  if (pendingStatuses.has(profile.status)) {
    const message = profile.status === "DRAFT" || profile.status === "NEEDS_CORRECTION"
      ? "Complete your KK Survey / Profiling to activate your YouthPass."
      : "Your KK profile is pending SK Chairperson verification.";

    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">KK YouthPass</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Status update</h1>
        <p className="mt-3 text-base text-slate-700">{message}</p>
        <Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
          Go to KK Survey / Profiling
        </Link>
      </section>
    );
  }

  if (profile.status !== "VERIFIED") {
    return (
      <section className="rounded-3xl border border-slate-200 bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK YouthPass</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">YouthPass unavailable</h1>
        <p className="mt-3 text-muted">Your KK profile is still being reviewed.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK YouthPass</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Verified digital ID</h1>
        <p className="mt-2 max-w-2xl text-muted">Your youth credential is active and available for verification by authorized SK channels.</p>
      </section>

      <YouthPassCard profile={profile} />
    </div>
  );
}
