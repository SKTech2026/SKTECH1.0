import Link from "next/link";
import { redirect } from "next/navigation";
import PrintCertificateButton from "@/components/kk/PrintCertificateButton";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";

export const dynamic = "force-dynamic";

export default async function KKCertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getKKUser();
  if (!member) redirect("/kk/login");

  const profile = await prisma.kKMemberProfile.findUnique({
    where: { userId: member.id },
    select: { id: true },
  });

  if (!profile) redirect("/dashboard/kk-member");

  const certificate = await prisma.kKCertificate.findFirst({
    where: {
      id,
      kkMemberProfileId: profile.id,
    },
    include: {
      kkMemberProfile: {
        select: {
          firstName: true,
          lastName: true,
          barangay: { select: { name: true } },
          municipality: { select: { name: true } },
        },
      },
    },
  });

  if (!certificate) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK Certificate</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Certificate not found</h1>
        <p className="mt-2 text-muted">This certificate does not exist or is not available to your account.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">KK Certificate</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">{certificate.title}</h1>
        </div>
        <PrintCertificateButton />
      </div>

      <article className="overflow-hidden rounded-[32px] border border-sky-200 bg-white shadow-[0_28px_70px_-30px_rgba(15,23,42,0.45)] print:shadow-none">
        <div className="bg-[linear-gradient(135deg,#071a34_0%,#0d2d5f_50%,#173e7a_100%)] p-5 text-white sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">Katipunan ng Kabataan</p>
              <h2 className="mt-2 text-3xl font-black">Certificate of Participation</h2>
            </div>
            <div className="rounded-2xl border border-sky-200/50 bg-sky-900/40 px-4 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-sky-200">Certificate No.</p>
              <p className="mt-1 text-sm font-bold">{certificate.certificateNumber}</p>
            </div>
          </div>
        </div>

        <div className="space-y-7 bg-white p-6 sm:p-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">This is to certify that</p>
            <h3 className="mt-2 text-3xl font-black text-slate-900">{certificate.kkMemberProfile.firstName} {certificate.kkMemberProfile.lastName}</h3>
            <p className="mt-2 text-sm text-slate-600">from Barangay {certificate.kkMemberProfile.barangay?.name ?? "Barangay"}, {certificate.kkMemberProfile.municipality?.name ?? "Municipality"}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Award / Recognition</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{certificate.title}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Type</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{certificate.certificateType.replaceAll("_", " ")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Verification</p>
            <p className="mt-2 text-sm text-slate-700">Verification code: <span className="font-bold text-slate-900">{certificate.verificationCode}</span></p>
            <p className="mt-2 text-sm text-slate-700">Issued on: <span className="font-bold text-slate-900">{new Date(certificate.issuedAt).toLocaleDateString()}</span></p>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Barangay official</p>
              <p className="mt-2 text-base font-semibold text-slate-900">SKTECH / Barangay {certificate.kkMemberProfile.barangay?.name ?? "Barangay"}</p>
            </div>
            <Link href={`/kk/certificates/${certificate.id}`} target="_blank" className="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground">
              Public verification
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
