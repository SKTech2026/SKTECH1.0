import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.ADMIN]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              Signed in as {authorizedSession.user.email}
            </p>
          </div>
          <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-3 py-1 text-xs font-semibold tracking-wide text-blue-200">
            ADMIN
          </span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/profiling"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-slate-800/80"
          >
            Profiling
          </Link>
          <Link
            href="/admin/attendance"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-slate-800/80"
          >
            Attendance
          </Link>
          <Link
            href="/admin/id-production"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-slate-800/80"
          >
            ID Production
          </Link>
          <Link
            href="/admin/scan-verifier"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-slate-800/80"
          >
            Scan Verifier
          </Link>
          <Link
            href="/admin/events"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-slate-800/80"
          >
            Events
          </Link>
          <Link
            href="/admin/users"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-slate-800/80"
          >
            User Management
          </Link>
        </div>
      </section>
    </main>
  );
}
