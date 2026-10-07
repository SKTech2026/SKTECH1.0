import Link from "next/link";

const privacyFeatures = [
  "Only public verification data is shown on public pages.",
  "Private profile details stay inside the member dashboard.",
  "Your YouthPass and certificates are verified using public-safe identifiers.",
];

export default function KKLandingPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_28%),linear-gradient(135deg,#061a35_0%,#0b2a4f_48%,#123c73_100%)] p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-200">Katipunan ng Kabataan</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome to the KK Portal</h1>
            </div>
            <div className="inline-flex items-center rounded-full border border-sky-200/60 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sky-100">
              Member access
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-6 text-sky-100/90">
            Access your membership, YouthPass, and certificate records in one secure space designed for KK members and barangay verification.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/kk/login" className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300">
              KK Member Login
            </Link>
            <Link href="/kk/login" className="inline-flex items-center justify-center rounded-xl border border-sky-200/60 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              I have an invite link
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Member access</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Login to your portal</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use your verified KK email and password to view your registration status, YouthPass, and certificates. If you received an invitation from your barangay, open that invitation link and continue from there.</p>
            <Link href="/kk/login" className="mt-4 inline-flex text-sm font-semibold text-sky-700 underline underline-offset-4">Open KK login</Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Verify YouthPass</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Public check</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use the public verification page for a YouthPass record using the issued ID from your card or QR code.</p>
            <p className="mt-4 text-sm font-medium text-slate-500">Public verification stays limited to safe fields only.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Verify certificate</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Public certificate lookup</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use a valid certificate number or QR code to verify official KK certificate issuance without exposing private member data.</p>
            <p className="mt-4 text-sm font-medium text-slate-500">Only public-safe certificate details are shown.</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Privacy notice</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Public-safe verification only</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {privacyFeatures.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Portal access</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">For SK Officials, Staff, and Admin</h2>
            </div>
            <Link href="/official/auth" className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
              Official portal
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            KK member functions stay in the KK portal. Official, staff, and admin access uses the separate official and internal portals.
          </p>
        </section>
      </div>
    </main>
  );
}
