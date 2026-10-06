import Link from "next/link";
import { redirect } from "next/navigation";
import YouthPassCard from "@/components/kk/YouthPassCard";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";

export const dynamic = "force-dynamic";

const pendingStatuses = new Set([
  "DRAFT",
  "PENDING_EMAIL_VERIFICATION",
  "PENDING_VERIFICATION",
  "NEEDS_CORRECTION",
]);

export default async function KKDashboard() {
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
        <p className="text-sm font-bold uppercase tracking-widest text-accent">My KK membership</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Profile unavailable</h1>
        <p className="mt-3 text-muted">Complete your KK Survey / Profiling to activate your YouthPass.</p>
        <Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
          KK Survey / Profiling
        </Link>
      </section>
    );
  }

  const isVerified = profile.status === "VERIFIED";
  const showYouthPassState = pendingStatuses.has(profile.status) || !isVerified;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">My KK membership</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Welcome, {profile.firstName}</h1>
        <p className="mt-3 text-muted">{profile.barangay?.name ?? "Barangay"}, {profile.municipality?.name ?? "Municipality"}</p>
        <p className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold">Profile status: {profile.status.replaceAll("_", " ")}</p>
        <p className="mt-4 text-sm text-muted">Only you and your authorized barangay SK Chairperson can access your individual profile.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/kk-member/profile" className="inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">KK Survey / Profiling</Link>
          <Link href="/dashboard/kk-member/youthpass" className="inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-foreground">View YouthPass</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Katipunan ng Kabataan YouthPass</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Your digital youth credential</h2>
          </div>
          <Link href="/dashboard/kk-member/youthpass" className="inline-flex rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground">Open full card</Link>
        </div>

        {showYouthPassState ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-slate-700">
            {profile.status === "DRAFT" || profile.status === "NEEDS_CORRECTION"
              ? "Complete your KK Survey / Profiling to activate your YouthPass."
              : "Your KK profile is pending SK Chairperson verification."}
          </div>
        ) : (
          <div className="mt-6">
            <YouthPassCard profile={profile} />
          </div>
        )}
      </section>
    </div>
  );
}
