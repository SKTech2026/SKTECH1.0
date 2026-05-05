import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-2xl border border-cyan-300/25 bg-slate-900/85 p-6 text-center shadow-[0_24px_70px_-36px_rgba(34,211,238,0.55)]">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/35 bg-slate-800/80 text-cyan-300">
          <WifiOff className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">You are offline</h1>
        <p className="mt-2 text-sm text-slate-300">
          SKTech mobile needs an internet connection for live face verification and attendance sync.
        </p>
        <Link
          href="/mobile"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950"
        >
          Try again
        </Link>
      </section>
    </main>
  );
}
