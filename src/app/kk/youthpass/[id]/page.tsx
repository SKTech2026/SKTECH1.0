import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicKKYouthPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await prisma.kKMemberProfile.findUnique({
    where: { id },
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
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">KK YouthPass</p>
          <h1 className="mt-3 text-2xl font-black text-slate-900">Verification unavailable</h1>
          <p className="mt-3 text-sm text-slate-600">This YouthPass record could not be found or is not accessible.</p>
        </div>
      </main>
    );
  }

  const verified = profile.status === "VERIFIED";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_28px_50px_-30px_rgba(15,23,42,0.30)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Katipunan ng Kabataan</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">YouthPass verification</h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Name</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{profile.firstName} {profile.lastName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">YouthPass ID</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{`KK-${profile.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Barangay</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{profile.barangay?.name ?? "Not specified"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Municipality</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{profile.municipality?.name ?? "Not specified"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">KK status</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{profile.status.replaceAll("_", " ")}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${verified ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-amber-200 bg-amber-100 text-amber-700"}`}>
              {verified ? "Verified" : "Not verified"}
            </span>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">Safe verification view: no private birthdate, contact number, or email is exposed.</p>
      </div>
    </main>
  );
}
