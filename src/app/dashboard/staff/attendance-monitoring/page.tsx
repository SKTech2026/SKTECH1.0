import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function StaffAttendanceMonitoringPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.STAFF]);
  const staffMunicipalityId = authorizedSession.user.municipalityPresidentId;

  if (!staffMunicipalityId) {
    redirect("/unauthorized?error=staff_unassigned");
  }

  const [records, activeCheckIns] = await Promise.all([
    prisma.officialAttendance.findMany({
      where: {
        official: {
          user: {
            municipalityOfficerId: staffMunicipalityId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        official: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.officialAttendance.count({
      where: {
        official: {
          user: {
            municipalityOfficerId: staffMunicipalityId,
          },
        },
        timeOut: null,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Attendance Command
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Attendance Monitoring</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Monitor live check-ins and check-outs from digital ID scans.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            Active Check-Ins: {activeCheckIns}
          </span>
          <Link
            href="/dashboard/staff/id-scanning"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Open Scanner
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-5 py-4">Official</th>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Time In</th>
              <th className="px-5 py-4">Time Out</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-foreground">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No attendance records available.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-semibold text-foreground">
                    {record.official.firstName} {record.official.lastName}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {record.event?.title ?? "General Attendance"}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {record.timeIn.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {record.timeOut ? record.timeOut.toLocaleString() : "--"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        record.timeOut
                          ? "bg-surface-elevated/70 text-foreground"
                          : "bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {record.timeOut ? "Checked Out" : "Checked In"}
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
