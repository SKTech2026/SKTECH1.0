import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";

export const dynamic = "force-dynamic";

const pendingStatuses = new Set(["DRAFT", "PENDING_EMAIL_VERIFICATION", "PENDING_VERIFICATION", "NEEDS_CORRECTION"]);

const typeStyles: Record<string, string> = {
  PARTICIPATION: "bg-blue-50 text-blue-700 border-blue-200",
  ATTENDANCE: "bg-amber-50 text-amber-700 border-amber-200",
  APPRECIATION: "bg-emerald-50 text-emerald-700 border-emerald-200",
  VOLUNTEER_SERVICE: "bg-violet-50 text-violet-700 border-violet-200",
};

export default async function KKCertificatesPage() {
  const member = await getKKUser();
  if (!member) redirect("/kk/login");

  const profile = await prisma.kKMemberProfile.findUnique({
    where: { userId: member.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      municipality: { select: { name: true } },
      barangay: { select: { name: true } },
    },
  });

  if (!profile) {
    return (
      <section className="rounded-3xl border border-dashed border-sky-200 bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK Certificates</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">No profile found</h1>
        <p className="mt-3 text-muted">Complete your KK Survey / Profiling to activate your digital certificate access.</p>
        <Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
          KK Survey / Profiling
        </Link>
      </section>
    );
  }

  if (pendingStatuses.has(profile.status)) {
    const message = profile.status === "DRAFT" || profile.status === "NEEDS_CORRECTION"
      ? "Complete your KK Survey / Profiling to activate your YouthPass and certificates."
      : "Your KK profile is pending SK Chairperson verification.";

    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">KK Certificates</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Certificates pending</h1>
        <p className="mt-3 text-base text-slate-700">{message}</p>
        <Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
          Go to KK Survey / Profiling
        </Link>
      </section>
    );
  }

  const certificates = await prisma.kKCertificate.findMany({
    where: { kkMemberProfileId: profile.id },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      title: true,
      certificateType: true,
      certificateNumber: true,
      issuedAt: true,
      status: true,
      verificationCode: true,
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK Certificates</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Your digital certificates</h1>
        <p className="mt-3 text-muted">Certificates are issued by your barangay and can be opened, printed, or verified securely.</p>
      </section>

      {certificates.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-200 bg-surface p-6 sm:p-8">
          <p className="text-base font-semibold text-foreground">No certificates yet.</p>
          <p className="mt-2 text-sm text-muted">Attend SK programs to receive your digital certificate.</p>
        </section>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="rounded-3xl border border-border bg-surface p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${typeStyles[certificate.certificateType] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {certificate.certificateType.replaceAll("_", " ")}
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-foreground">{certificate.title}</h2>
                  <p className="mt-1 text-sm text-muted">Certificate no. {certificate.certificateNumber}</p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Issued</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
                  <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${certificate.status === "ISSUED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {certificate.status}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/dashboard/kk-member/certificates/${certificate.id}`} className="inline-flex rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white">
                  Open certificate
                </Link>
                <Link href={`/kk/certificates/${certificate.id}`} target="_blank" className="inline-flex rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground">
                  Verify public record
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
