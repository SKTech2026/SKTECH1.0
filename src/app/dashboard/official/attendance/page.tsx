import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

function parsePage(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function parsePageSize(value: string | string[] | undefined) {
  const pageSize = Number(Array.isArray(value) ? value[0] : value);
  return PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? pageSize
    : DEFAULT_PAGE_SIZE;
}

export default async function OfficialAttendanceLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const authorizedSession = await requireOfficialFeatureAccess(session);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedPage = parsePage(resolvedSearchParams.page);
  const pageSize = parsePageSize(resolvedSearchParams.pageSize);

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

  const attendanceWhere = user?.official
    ? { officialId: user.official.id }
    : null;
  const totalRecords = attendanceWhere
    ? await prisma.officialAttendance.count({ where: attendanceWhere })
    : 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const logs = attendanceWhere
    ? await prisma.officialAttendance.findMany({
        where: attendanceWhere,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          event: {
            select: {
              title: true,
            },
          },
        },
      })
    : [];
  const firstRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = totalRecords === 0 ? 0 : firstRecord + logs.length - 1;
  const pageHref = (nextPage: number, nextPageSize = pageSize) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(nextPageSize),
    });
    return `?${params.toString()}`;
  };

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
        {totalRecords > 0 ? (
          <footer className="flex flex-col gap-4 border-t border-glass-border px-5 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {firstRecord}-{lastRecord} of {totalRecords} records
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1" aria-label="Page size">
                <span className="mr-1 text-xs">Rows</span>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <Link
                    key={option}
                    href={pageHref(1, option)}
                    aria-current={option === pageSize ? "page" : undefined}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      option === pageSize
                        ? "bg-accent text-accent-foreground"
                        : "text-muted hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    {option}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    aria-label="Go to previous attendance page"
                    className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                  >
                    Previous
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-muted opacity-50"
                  >
                    Previous
                  </span>
                )}
                <span className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    aria-label="Go to next attendance page"
                    className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                  >
                    Next
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-muted opacity-50"
                  >
                    Next
                  </span>
                )}
              </div>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
