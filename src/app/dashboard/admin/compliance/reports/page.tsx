import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { COMPLIANCE_LIMITATION, getComplianceMetrics, METRIC_DEFINITIONS } from "@/lib/compliance/metrics";
import { getPendingAdmissionsByMunicipality, parseReportType, REPORT_TYPES } from "@/lib/compliance/report-metrics";
import { requireRole } from "@/lib/roleGuard";

import PrintControls from "./print-controls";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const format = (value: number) => new Intl.NumberFormat("en-PH").format(value);

export default async function ComplianceReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);

  const params = (await searchParams) ?? {};
  const reportType = parseReportType(params.report);
  const report = REPORT_TYPES.find((item) => item.key === reportType)!;
  const { generatedAt, summary, indicators, municipalities } = await getComplianceMetrics();
  const pendingByMunicipality = reportType === "admissions"
    ? await getPendingAdmissionsByMunicipality()
    : null;
  const generatedLabel = new Date(generatedAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "long",
    timeStyle: "short",
  });

  let cards: [string, string][] = [];
  let headings: string[] = [];
  let rows: string[][] = [];
  let definitionIndexes: number[] = [];
  let scopeNote = "Current system snapshot and all recorded dates through the generated timestamp.";
  let reportNote = "Counts describe records in SKTECH. They do not establish completion of any external requirement.";

  switch (reportType) {
    case "provincial":
      cards = [
        ["Registered officials", format(summary.registeredOfficials)],
        ["Approved officials", format(summary.approvedOfficials)],
        ["Pending admissions", format(summary.pendingAdmissions)],
        ["Active officials", format(summary.activeOfficials)],
        ["Approved staff", format(summary.approvedStaff)],
        ["Total events", format(summary.totalEvents)],
        ["Recorded attendance logs", format(summary.attendanceLogs)],
        ["Province LGU coverage", `${summary.provinceLguCoverage} / ${summary.provinceLguTotal}`],
      ];
      headings = ["Municipality", "Registered officials", "Approved officials", "Approved staff", "Linked events", "Recorded attendance logs"];
      rows = municipalities.map((item) => [item.name, format(item.registeredOfficials), format(item.approvedOfficials), format(item.approvedStaff), format(item.eventsLinked), format(item.attendanceLogs)]);
      definitionIndexes = [0, 1, 2, 3, 4, 5, 6, 7];
      break;
    case "municipality":
      cards = [
        ["Linked events", format(summary.totalEvents - indicators.eventsMissingMunicipality)],
        ["Events without municipality", format(indicators.eventsMissingMunicipality)],
        ["Recorded attendance logs", format(summary.attendanceLogs)],
        ["Municipalities with records", `${indicators.municipalityCoverage} / ${summary.provinceLguTotal}`],
      ];
      headings = ["Municipality", "Linked events", "Recorded attendance logs", "Operational status"];
      rows = municipalities.map((item) => [item.name, format(item.eventsLinked), format(item.attendanceLogs), item.operationalStatus]);
      definitionIndexes = [5, 6, 9, 14];
      reportNote = "Event and attendance counts use all recorded dates. Events without a recognized municipality are shown in the summary but not assigned to a municipality row.";
      break;
    case "attendance": {
      const attributedLogs = municipalities.reduce((total, item) => total + item.attendanceLogs, 0);
      cards = [
        ["Recorded attendance logs", format(summary.attendanceLogs)],
        ["Attributed to municipalities", format(attributedLogs)],
        ["Unattributed logs", format(summary.attendanceLogs - attributedLogs)],
        ["Municipalities with logs", format(municipalities.filter((item) => item.attendanceLogs > 0).length)],
      ];
      headings = ["Municipality", "Recorded attendance logs"];
      rows = municipalities.map((item) => [item.name, format(item.attendanceLogs)]);
      definitionIndexes = [6];
      reportNote = "These are recorded attendance logs, not verified participation rates. SKTECH does not record an expected roster denominator for this report.";
      break;
    }
    case "profiling":
      cards = [
        ["Registered officials", format(summary.registeredOfficials)],
        ["Core profiles complete", `${format(indicators.completeProfiles)} / ${format(summary.registeredOfficials)}`],
        ["Missing location links", format(indicators.missingLocationOfficials)],
        ["Barangay profile coverage", `${indicators.barangayCoverage} / ${indicators.barangayTotal}`],
      ];
      headings = ["Municipality", "Registered officials", "Approved officials", "Active officials", "Missing location links"];
      rows = municipalities.map((item) => [item.name, format(item.registeredOfficials), format(item.approvedOfficials), format(item.activeOfficials), format(item.missingLocationRecords)]);
      definitionIndexes = [0, 1, 3, 8, 10, 11];
      scopeNote = "Current profile snapshot at the generated timestamp; no historical period is implied.";
      reportNote = "Core completion is a province-wide count. Municipality rows show location linkage gaps, not municipality completion rates. Officials without a recognized municipality are included in the province totals only.";
      break;
    case "admissions":
      cards = [
        ["Current pending admissions", format(summary.pendingAdmissions)],
        ["Pending without municipality", format(pendingByMunicipality?.unattributed ?? 0)],
        ["Pending profile changes", format(indicators.pendingProfileChanges)],
      ];
      headings = ["Municipality", "Current pending admissions"];
      rows = municipalities.map((item) => [item.name, format(pendingByMunicipality?.counts.get(item.name) ?? 0)]);
      definitionIndexes = [2, 13];
      scopeNote = "Current admission status snapshot at the generated timestamp; no historical period is implied.";
      reportNote = "Pending admissions count SKOfficial records with PENDING admission status. Pending profile change requests are a separate workflow.";
      break;
  }

  return (
    <div className="space-y-6">
      <style>{`@media print {
        @page { size: A4; margin: 14mm; }
        body, main { background: #fff !important; color: #111 !important; }
        body aside, body header, body nav, .report-screen-only { display: none !important; }
        main { padding: 0 !important; }
        main > div { max-width: none !important; margin: 0 !important; }
        #sktech-print-report { width: 100% !important; margin: 0 !important; color: #111 !important; background: #fff !important; box-shadow: none !important; }
        #sktech-print-report * { color: #111 !important; background: transparent !important; box-shadow: none !important; }
        #sktech-print-report table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        #sktech-print-report th, #sktech-print-report td { border: 1px solid #888; padding: 5px; }
        #sktech-print-report .overflow-x-auto { overflow: visible !important; }
        #sktech-print-report table { min-width: 0 !important; table-layout: fixed; }
        #sktech-print-report th, #sktech-print-report td { overflow-wrap: anywhere; }
        #sktech-print-report thead { display: table-header-group; }
        #sktech-print-report tr, #sktech-print-report .report-card { break-inside: avoid; }
      }`}</style>

      <section className="report-screen-only rounded-2xl border border-glass-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Recorded SKTECH system activity</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Government report generator</h1>
        <p className="mt-2 text-sm text-muted">Select an operational report, then print or save it as a PDF using your browser.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrintControls />
          <Link href="/api/admin/compliance/export" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground">Export aggregate CSV</Link>
          <Link href="/dashboard/admin/compliance" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-foreground">Back to dashboard</Link>
        </div>
      </section>

      <section className="report-screen-only" aria-label="Select report type">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {REPORT_TYPES.map((item) => (
            <Link
              key={item.key}
              href={`/dashboard/admin/compliance/reports?report=${item.key}`}
              aria-current={item.key === reportType ? "page" : undefined}
              className={`rounded-xl border p-4 ${item.key === reportType ? "border-accent bg-accent/10" : "border-glass-border bg-surface"}`}
            >
              <span className="block text-sm font-semibold text-foreground">{item.title}</span>
              <span className="mt-1 block text-xs text-muted">{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <article id="sktech-print-report" className="space-y-5 rounded-2xl border border-glass-border bg-surface p-5 sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">SKTECH · Recorded system activity · Operational indicators</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{report.title}</h2>
          <p className="mt-2 text-sm text-muted">Oriental Mindoro · Generated {generatedLabel} PHT</p>
          <p className="mt-1 text-sm text-muted">Reporting scope: {scopeNote}</p>
        </div>

        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">{COMPLIANCE_LIMITATION}</p>
        <p className="text-sm text-muted">Older logs are attributed using the official’s current municipality link. Events without a municipality remain unattributed.</p>
        <p className="text-sm text-muted">{reportNote}</p>

        <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="report-card rounded-xl border border-glass-border p-4">
              <p className="text-xs font-semibold uppercase text-muted">{label}</p>
              <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>

        <section aria-label="Municipality aggregates" className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead><tr>{headings.map((heading) => <th key={heading} scope="col" className="border-b border-glass-border px-2 py-2 font-semibold">{heading}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row[0]} className="border-b border-glass-border"><th scope="row" className="px-2 py-2 font-medium">{row[0]}</th>{row.slice(1).map((cell, index) => <td key={`${row[0]}-${headings[index + 1]}`} className="px-2 py-2">{cell}</td>)}</tr>)}</tbody>
          </table>
        </section>

        <section aria-label="Metric definitions">
          <h3 className="text-base font-semibold text-foreground">Metric definitions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            {definitionIndexes.map((index) => <li key={index}>{METRIC_DEFINITIONS[index]}</li>)}
          </ul>
        </section>
        <footer className="border-t border-glass-border pt-3 text-xs text-muted">Generated by SKTECH. Aggregate operational indicators only.</footer>
      </article>
    </div>
  );
}
