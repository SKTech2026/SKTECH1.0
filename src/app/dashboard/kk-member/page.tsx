import TranslatedText from "@/components/i18n/TranslatedText";
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
        <p className="text-sm font-bold uppercase tracking-widest text-accent"><TranslatedText text="My KK membership" /></p>
        <h1 className="mt-3 text-3xl font-bold text-foreground"><TranslatedText text="Profile unavailable" /></h1>
        <p className="mt-3 text-muted"><TranslatedText text="Complete your KK Survey / Profiling to activate your YouthPass." /></p>
        <Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
          <TranslatedText text="KK Survey / Profiling" />
        </Link>
      </section>
    );
  }

  const isVerified = profile.status === "VERIFIED";
  const showYouthPassState = pendingStatuses.has(profile.status) || !isVerified;
  const certificateCount = await prisma.kKCertificate.count({ where: { kkMemberProfileId: profile.id } });
  const activity = [
    { title: "Profile submitted", description: new Date(profile.createdAt).toLocaleDateString(), active: true },
    { title: "Profile verified", description: isVerified ? "Verified by your SK Chairperson" : "Awaiting verification", active: isVerified },
    { title: "Certificate issued", description: certificateCount > 0 ? `${certificateCount} certificate${certificateCount > 1 ? "s" : ""} issued` : "No certificates yet", active: certificateCount > 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_28%),linear-gradient(135deg,#071a34_0%,#0d2d5f_48%,#163f7d_100%)] p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">Barangay {profile.barangay?.name ?? "Barangay"} KK Portal</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl"><TranslatedText text="Welcome to Barangay" /> {profile.barangay?.name ?? "Barangay"} KK Portal</h1>
        <p className="mt-3 max-w-2xl text-sm text-sky-100"><TranslatedText text="Your profile, YouthPass, and digital certificates stay organized in one secure portal." /></p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/kk-member/profile" className="inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900"><TranslatedText text="Complete KK Survey / Profiling" /></Link>
          <Link href="/dashboard/kk-member/youthpass" className="inline-flex rounded-xl border border-sky-200/60 bg-white/5 px-5 py-3 text-sm font-semibold text-white"><TranslatedText text="View YouthPass" /></Link>
          <Link href="/dashboard/kk-member/certificates" className="inline-flex rounded-xl border border-sky-200/60 bg-white/5 px-5 py-3 text-sm font-semibold text-white"><TranslatedText text="View Certificates" /></Link>
          <Link href="/dashboard/kk-member/profile" className="inline-flex rounded-xl border border-sky-200/60 bg-white/5 px-5 py-3 text-sm font-semibold text-white"><TranslatedText text="View Verification Status" /></Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><TranslatedText text="Profile status" /></p>
          <p className="mt-3 text-2xl font-black text-foreground"><TranslatedText text={profile.status.replaceAll("_", " ")} /></p>
          <p className="mt-2 text-sm text-muted"><TranslatedText text={isVerified ? "Your profile is active and verified." : "Update your profile to unlock YouthPass and certificates."} /></p>
        </article>
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><TranslatedText text="YouthPass status" /></p>
          <p className="mt-3 text-2xl font-black text-foreground"><TranslatedText text={showYouthPassState ? "Pending" : "Active"} /></p>
          <p className="mt-2 text-sm text-muted"><TranslatedText text={showYouthPassState ? "Awaiting verification readiness." : "Digital youth credential available."} /></p>
        </article>
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><TranslatedText text="Certificates" /></p>
          <p className="mt-3 text-2xl font-black text-foreground">{certificateCount}</p>
          <p className="mt-2 text-sm text-muted"><TranslatedText text="Digital recognition for barangay programs and activities." /></p>
        </article>
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Barangay</p>
          <p className="mt-3 text-2xl font-black text-foreground">{profile.barangay?.name ?? "Barangay"}</p>
          <p className="mt-2 text-sm text-muted">{profile.municipality?.name ?? "Municipality"}, {profile.province ?? "Province"}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)]">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-accent">Katipunan ng Kabataan YouthPass</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground"><TranslatedText text="Your digital youth credential" /></h2>
            </div>
            <Link href="/dashboard/kk-member/youthpass" className="inline-flex rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground"><TranslatedText text="Open full card" /></Link>
          </div>

          {showYouthPassState ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-slate-700">
              <TranslatedText text={profile.status === "DRAFT" || profile.status === "NEEDS_CORRECTION"
                ? "Complete your KK Survey / Profiling to activate your YouthPass."
                : "Your KK profile is pending SK Chairperson verification."} />
            </div>
          ) : (
            <div className="mt-6">
              <YouthPassCard profile={profile} />
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-accent"><TranslatedText text="Recent activity" /></p>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground"><TranslatedText text={item.title} /></p>
                  <p className="mt-1 text-xs text-muted"><TranslatedText text={item.description} /></p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
