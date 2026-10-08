"use client";

import Link from "next/link";
import { ArrowLeft, RotateCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#06132d] px-4 py-[calc(2rem_+_env(safe-area-inset-bottom))] text-white">
      <section className="w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-900/85 p-6 text-center shadow-[0_24px_70px_-36px_rgba(34,211,238,0.55)]">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-400/10 text-cyan-300">
          <WifiOff className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">SKTECH</p>
        <h1 className="mt-2 text-2xl font-bold">You’re offline</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">Some SKTECH features need internet connection. Reconnect to use live verification, attendance, and account services.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><RotateCw className="h-4 w-4" />Try again</button>
          <Link href="/" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><ArrowLeft className="h-4 w-4" />Back to home</Link>
        </div>
      </section>
    </main>
  );
}
