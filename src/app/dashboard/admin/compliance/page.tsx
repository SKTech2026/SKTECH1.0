import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { COMPLIANCE_LIMITATION, getComplianceMetrics, METRIC_DEFINITIONS } from "@/lib/compliance/metrics";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

const format = (value: number) => new Intl.NumberFormat("en-PH").format(value);

export default async function AdminCompliancePage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);
  const { generatedAt, summary, indicators, municipalities } = await getComplianceMetrics();

  const cards = [
    ["Registered officials", format(summary.registeredOfficials)],
    ["Approved officials", format(summary.approvedOfficials)],
    ["Pending admissions", format(summary.pendingAdmissions)],
    ["Active officials", format(summary.activeOfficials)],
    ["Approved staff", format(summary.approvedStaff)],
    ["Total events", format(summary.totalEvents)],
    ["Recorded attendance logs", format(summary.attendanceLogs)],
    ["Province LGU coverage", `${summary.provinceLguCoverage} / ${summary.provinceLguTotal}`],
  ];

  const operationalIndicators = [
    ["Core profile completion", `${format(indicators.completeProfiles)} / ${format(summary.registeredOfficials)} (${summary.registeredOfficials === 0 ? "N/A" : `${Math.round((indicators.completeProfiles / summary.registeredOfficials) * 100)}%`})`],
    ["Municipality activity coverage", `${indicators.municipalityCoverage} / ${summary.provinceLguTotal}`],
    ["Barangay profile coverage", `${indicators.barangayCoverage} / ${indicators.barangayTotal}`],
    ["Officials with missing location links", format(indicators.missingLocationOfficials)],
    ["Of those, missing municipality", format(indicators.missingMunicipalityOfficials)],
    ["Events with missing municipality link", format(indicators.eventsMissingMunicipality)],
    ["Active approved officials: term end within 90 days", format(indicators.termApproaching)],
    ["Active approved officials: past term end", format(indicators.termPast)],
    ["Pending profile change requests", format(indicators.pendingProfileChanges)],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-glass-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Recorded system activity</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">SK Performance and Compliance Monitoring</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">Operational indicators for Oriental Mindoro, generated {new Date(generatedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} PHT.</p>
          </div>
          <Link href="/api/admin/compliance/export" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Export aggregate CSV</Link>
          <Link href="/dashboard/admin/compliance/reports" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground">Open printable reports</Link>
        </div>
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">{COMPLIANCE_LIMITATION}</p>
      </section>

      <section aria-labelledby="executive-summary" className="space-y-3">
        <h2 id="executive-summary" className="text-xl font-semibold text-foreground">Executive summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-glass-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-2 text-2xl font-bold text-accent">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="operational-indicators" className="space-y-3">
        <h2 id="operational-indicators" className="text-xl font-semibold text-foreground">Operational indicators</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {operationalIndicators.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-glass-border bg-surface p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="municipality-table" className="space-y-3">
        <h2 id="municipality-table" className="text-xl font-semibold text-foreground">Municipality records</h2>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-surface">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-surface-elevated text-xs uppercase text-muted">
              <tr>
                {["Municipality", "Reference barangays", "Registered officials", "Approved officials", "Active officials", "Approved staff", "Linked events", "Attendance logs", "Missing location records", "Operational status"].map((heading) => (
                  <th key={heading} scope="col" className="px-3 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {municipalities.map((row) => (
                <tr key={row.name} className="border-t border-glass-border text-foreground">
                  <th scope="row" className="whitespace-nowrap px-3 py-3 font-medium">{row.name}</th>
                  <td className="px-3 py-3">{row.barangayCount}</td>
                  <td className="px-3 py-3">{row.registeredOfficials}</td>
                  <td className="px-3 py-3">{row.approvedOfficials}</td>
                  <td className="px-3 py-3">{row.activeOfficials}</td>
                  <td className="px-3 py-3">{row.approvedStaff}</td>
                  <td className="px-3 py-3">{row.eventsLinked}</td>
                  <td className="px-3 py-3">{row.attendanceLogs}</td>
                  <td className="px-3 py-3">{row.missingLocationRecords}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.operationalStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-glass-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Metric definitions</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          {METRIC_DEFINITIONS.map((definition) => <li key={definition}>{definition}</li>)}
        </ul>
      </section>
    </div>
  );
}
