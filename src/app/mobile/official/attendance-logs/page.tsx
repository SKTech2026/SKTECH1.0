import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialAttendanceLogsPage() {
  const session = await getServerSession(authOptions);
  const authorized = await requireOfficialFeatureAccess(session);
  const user = await prisma.user.findUnique({
    where: { id: authorized.user.id },
    select: {
      official: {
        select: {
          attendances: {
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { event: { select: { title: true } } },
          },
        },
      },
    },
  });
  const attendances = user?.official?.attendances ?? [];

  return (
    <div className="space-y-4">
      <Link href="/mobile/official" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <header className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Official Mobile</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Attendance Logs</h1>
        <p className="mt-1 text-sm text-muted">Your recent attendance records.</p>
      </header>
      <section className="space-y-3">
        {attendances.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-glass-border bg-surface p-4 text-sm text-muted">
            No attendance logs yet.
          </p>
        ) : (
          attendances.map((record) => (
            <article key={record.id} className="rounded-2xl border border-glass-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-foreground">{record.event?.title ?? "General Attendance"}</h2>
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted">
                <Clock3 className="h-4 w-4 text-cyan-300" />
                {record.timeIn.toLocaleString()}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {record.timeOut ? "Checked out" : "Checked in"}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
