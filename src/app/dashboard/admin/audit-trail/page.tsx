import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  AUDIT_CATEGORIES,
  AUDIT_PAGE_SIZE,
  AUDIT_TARGETS,
  auditPageHref,
  getAuditTrail,
  parseAuditQuery,
} from "@/lib/audit-trail";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

type AuditTrailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const dateTime = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminAuditTrailPage({ searchParams }: AuditTrailPageProps) {
  const session = await getServerSession(authOptions);
  const approvedSession = requireRole(session, [Role.ADMIN]);
  const currentUser = await prisma.user.findUnique({
    where: { id: approvedSession.user.id },
    select: { role: true, status: true },
  });
  if (currentUser?.role !== Role.ADMIN || currentUser.status !== UserStatus.APPROVED) {
    redirect("/unauthorized");
  }

  const query = parseAuditQuery((await searchParams) ?? {});
  const result = await getAuditTrail(query);
  const first = result.total === 0 ? 0 : (result.page - 1) * AUDIT_PAGE_SIZE + 1;
  const last = (result.page - 1) * AUDIT_PAGE_SIZE + result.rows.length;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-glass-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Accountability center</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Audit Trail</h1>
        <p className="mt-2 text-sm text-muted">A read-only view of actions recorded by SKTECH.</p>
      </header>

      <div className="space-y-3">
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
          This audit trail shows recorded SKTECH system actions only. Some system actions are not yet logged, and actor role/municipality reflect current account data, not necessarily values at the event time.
        </p>
        <p className="rounded-xl border border-glass-border bg-surface p-4 text-sm text-muted">
          Sensitive information such as passwords, OTPs, tokens, proof documents, face data, exact GPS coordinates, and private profile details are intentionally excluded.
        </p>
        <p className="text-xs text-muted">
          Action names in this table do not prove their source. The mobile session endpoint accepts client-submitted values; mobile activity is labeled unverified, and module labels are inferred from action names.
        </p>
      </div>

      <section className="rounded-2xl border border-glass-border bg-surface p-5" aria-labelledby="audit-filters">
        <h2 id="audit-filters" className="text-lg font-semibold text-foreground">Filters</h2>
        <form method="get" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-muted">
            From date
            <input type="date" name="from" defaultValue={query.from} className="mt-1 block w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-foreground" />
          </label>
          <label className="text-sm text-muted">
            To date
            <input type="date" name="to" defaultValue={query.to} className="mt-1 block w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-foreground" />
          </label>
          <label className="text-sm text-muted">
            Action category
            <select name="category" defaultValue={query.category} className="mt-1 block w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-foreground">
              <option value="">All categories</option>
              {AUDIT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted">
            Current actor role
            <select name="role" defaultValue={query.role} className="mt-1 block w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-foreground">
              <option value="">All roles</option>
              {Object.values(Role).map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted">
            Current actor municipality
            <select name="municipalityId" defaultValue={result.municipalityId} className="mt-1 block w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-foreground">
              <option value="">All municipalities</option>
              {result.municipalities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted">
            Target type
            <select name="target" defaultValue={query.target} className="mt-1 block w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-foreground">
              <option value="">All target types</option>
              {AUDIT_TARGETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
            <Link href="/dashboard/admin/audit-trail" className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground">Clear filters</Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-5" aria-labelledby="audit-results">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="audit-results" className="text-lg font-semibold text-foreground">Recorded actions</h2>
            <p className="mt-1 text-sm text-muted">{result.total.toLocaleString("en-PH")} total · {result.rows.length} on this page · showing {first}–{last}</p>
          </div>
          <p className="text-sm text-muted">Page {result.page} of {result.totalPages}</p>
        </div>

        {result.rows.length === 0 ? (
          <p className="mt-5 rounded-xl border border-glass-border bg-surface-elevated p-5 text-sm text-muted">No recorded actions match these filters.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-glass-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-3">Time (PHT)</th>
                  <th scope="col" className="px-3 py-3">Action and summary</th>
                  <th scope="col" className="px-3 py-3">Current actor role</th>
                  <th scope="col" className="px-3 py-3">Current municipality</th>
                  <th scope="col" className="px-3 py-3">Target</th>
                  <th scope="col" className="px-3 py-3">Mapped module</th>
                  <th scope="col" className="px-3 py-3">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {result.rows.map((row) => (
                  <tr key={row.id} className="text-foreground">
                    <td className="whitespace-nowrap px-3 py-3">{dateTime.format(row.timestamp)}</td>
                    <td className="px-3 py-3">
                      <span className="font-medium">{row.summary}</span>
                      <span className="mt-1 block text-xs text-muted">{row.category}</span>
                    </td>
                    <td className="px-3 py-3">{row.currentRole}</td>
                    <td className="px-3 py-3">{row.currentMunicipality ?? "Not linked"}</td>
                    <td className="px-3 py-3">{row.target}</td>
                    <td className="px-3 py-3">{row.source}</td>
                    <td className="px-3 py-3">{row.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav aria-label="Audit trail pages" className="mt-5 flex items-center justify-end gap-3 text-sm">
          {result.page > 1 ? <Link href={auditPageHref(query, result.page - 1)} className="rounded-lg border border-glass-border px-4 py-2 text-foreground">Previous</Link> : null}
          {result.page < result.totalPages ? <Link href={auditPageHref(query, result.page + 1)} className="rounded-lg border border-glass-border px-4 py-2 text-foreground">Next</Link> : null}
        </nav>
      </section>
    </div>
  );
}
