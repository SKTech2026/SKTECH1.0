import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicKKCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const certificate = await prisma.kKCertificate.findUnique({
    where: { id },
    select: {
      id: true,
      certificateNumber: true,
      title: true,
      certificateType: true,
      status: true,
      issuedAt: true,
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

  if (!certificate || certificate.status === "REVOKED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">KK Certificate</p>
          <h1 className="mt-3 text-2xl font-black text-slate-900">Verification unavailable</h1>
          <p className="mt-3 text-sm text-slate-600">This certificate could not be found or is no longer valid for public verification.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.32)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Katipunan ng Kabataan</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Certificate verification</h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Certificate title</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{certificate.title}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Certificate type</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{certificate.certificateType.replaceAll("_", " ")}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recipient</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{certificate.kkMemberProfile.firstName} {certificate.kkMemberProfile.lastName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Certificate number</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{certificate.certificateNumber}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Barangay</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{certificate.kkMemberProfile.barangay?.name ?? "Not specified"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Municipality</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{certificate.kkMemberProfile.municipality?.name ?? "Not specified"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">Issued date</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${certificate.status === "ISSUED" ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-red-200 bg-red-100 text-red-700"}`}>
              {certificate.status}
            </span>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">Safe certificate verification only shows public fields and excludes private profile data.</p>
      </div>
    </main>
  );
}
