import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function OfficialAttendanceLogsPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = await requireOfficialFeatureAccess(session);

  const user = await prisma.user.findUnique({
    where: { id: authorizedSession.user.id },
    select: {
      official: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const logs = user?.official
    ? await prisma.officialAttendance.findMany({
        where: {
          officialId: user.official.id,
        },
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: {
              title: true,
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Participation Ledger
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Attendance Logs</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Verified check-in and check-out history for your official account.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Time In</th>
              <th className="px-5 py-4">Time Out</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-foreground">
            {!user?.official ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  No linked official profile found.
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 font-semibold text-foreground">
                    {log.event?.title ?? "General Attendance"}
                  </td>
                  <td className="px-5 py-4 text-muted">{log.timeIn.toLocaleString()}</td>
                  <td className="px-5 py-4 text-muted">
                    {log.timeOut ? log.timeOut.toLocaleString() : "--"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.timeOut
                          ? "bg-surface-elevated/70 text-foreground"
                          : "bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {log.timeOut ? "Checked Out" : "Checked In"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
