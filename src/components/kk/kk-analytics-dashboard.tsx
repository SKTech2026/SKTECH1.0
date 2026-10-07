import KkAnalyticsCharts, { type ChartPoint } from "@/components/kk/analytics/KkAnalyticsCharts";
import KkAnalyticsRangeFilter from "@/components/kk/analytics/KkAnalyticsRangeFilter";
import KkAnalyticsPrintButton from "@/components/kk/analytics/KkAnalyticsPrintButton";
import KkAnalyticsPrintReport from "@/components/kk/analytics/KkAnalyticsPrintReport";
import type { KkAnalyticsPayload } from "@/lib/kk/analytics";
import { KK_ANALYTICS_RANGES, type KkAnalyticsRange } from "@/lib/kk/analytics-range";

type DistributionItem = { label: string; count: number; percentage: number };
type Group = { title: string; items: DistributionItem[] };
type Metric = { label: string; value: string; detail: string };
type Insight = { title: string; value: string; detail: string };

type Props = {
  report: KkAnalyticsPayload;
  range: KkAnalyticsRange;
  pathname: string;
  periodRegistrations: number;
  periodCertificates: number;
  periodCertificateTypes: DistributionItem[];
  title: string;
  subtitle: string;
  stats: Metric[];
  statusBreakdown?: Array<{ label: string; count: number; color: string }>;
  demographics: Group[];
  workStatus: DistributionItem[];
  civic: Group[];
  coverage: Group[];
  youthPass: Metric[];
  certificates: Group[];
  quality: Metric[];
  insights: Insight[];
  emptyMessage?: string;
};

const points = (items: DistributionItem[] = []): ChartPoint[] => items.map(({ label, count }) => ({ label, count }));
const panel = "min-w-0 rounded-xl border border-slate-700/70 bg-[#0c1729] p-3.5 shadow-[0_10px_24px_-18px_rgba(0,0,0,.65)]";

function ChartPanel({ title, data, kind, caption }: { title: string; data: ChartPoint[]; kind: "status" | "donut" | "horizontal"; caption?: string }) {
  return <section className={panel}><div className="mb-2 flex items-start justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-slate-200">{title}</h2><span className="shrink-0 text-[10px] tabular-nums text-slate-500">{data.reduce((sum, item) => sum + item.count, 0).toLocaleString()} total</span></div><KkAnalyticsCharts kind={kind} data={data} label={title} />{caption && <p className="mt-1 text-[11px] text-slate-500">{caption}</p>}</section>;
}

export default function KkAnalyticsDashboard({ report, range, pathname, periodRegistrations, periodCertificates, periodCertificateTypes, title, subtitle, stats, statusBreakdown = [], demographics, workStatus, civic, coverage, youthPass, certificates, quality, insights, emptyMessage = "No KK profiles recorded yet." }: Props) {
  const generatedAt = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "long", timeStyle: "short" });
  const periodLabel = KK_ANALYTICS_RANGES.find((option) => option.value === range)?.label ?? "All time";
  const age = demographics.find((group) => group.title.toLowerCase().includes("age group"))?.items ?? [];
  const classification = demographics.find((group) => group.title.toLowerCase().includes("classification"))?.items ?? [];
  const civicCounts = civic.slice(0, 4).map((group) => ({ label: group.title.replace("Registered ", "").replace("Voted last election", "Voted last election").replace("Attended KK Assembly", "KK assembly"), count: group.items[0]?.count ?? 0 }));
  const coverageRankings = coverage.filter((group) => /members per|barangay totals/i.test(group.title));
  const emptyAreas = coverage.find((group) => /no KK profiles/i.test(group.title))?.items ?? [];
  const certificateTypes = periodCertificateTypes;
  const revoked = certificates.find((group) => /revoked/i.test(group.title))?.items[0]?.count ?? 0;
  const qualityCounts = quality.map((item) => ({ label: item.label.replace("Profiles with ", "").replace(" count", ""), count: Number(item.value) || 0 }));
  const warnings = quality.filter((item) => Number(item.value) > 0).sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 2);
  const total = Number(stats[0]?.value ?? 0);

  return <><div className="kk-analytics-screen min-w-0 space-y-3 text-slate-100">
    <header className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-700/70 bg-[#0a1424] px-4 py-3">
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-400">KK monitoring / live aggregates</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1><p className="mt-1 max-w-3xl text-xs text-slate-400">{subtitle}</p></div>
      <div className="flex min-w-0 flex-col items-start gap-1.5"><span className="text-[11px] font-semibold text-sky-300">Period: {periodLabel}</span><KkAnalyticsRangeFilter range={range} pathname={pathname} /><div className="flex flex-wrap gap-1.5"><a href={`/api/kk/analytics/export?range=${range}`} className="rounded-md border border-slate-600 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800">Export CSV</a><KkAnalyticsPrintButton /></div></div>
    </header>

    <section aria-label="Period activity" className="grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-sky-700/40 bg-sky-950/30 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-sky-300">New registrations · {periodLabel}</p><strong className="text-xl tabular-nums text-white">{periodRegistrations}</strong></div><div className="rounded-lg border border-sky-700/40 bg-sky-950/30 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-sky-300">Certificates issued · {periodLabel}</p><strong className="text-xl tabular-nums text-white">{periodCertificates}</strong></div></section>
    <p className="text-[11px] text-slate-500">Period uses Philippine calendar time. Registry, demographic, civic, coverage, YouthPass, data quality, and the six headline metrics below are all-time snapshots.</p>
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{stats.slice(0, 6).map((item) => <div key={item.label} className="min-w-0 rounded-xl border border-slate-700/70 bg-[#0c1729] px-3 py-2.5"><p className="truncate text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400" title={item.label}>{item.label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-white">{item.value}</p><p className="truncate text-[10px] text-slate-500" title={item.detail}>{item.detail}</p></div>)}</section>

    {total === 0 && <p role="status" className="rounded-lg border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs text-sky-200">{emptyMessage} Charts will populate from registered members in this scope.</p>}

    <div className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      <ChartPanel title="Registration status" kind="status" data={statusBreakdown.map(({ label, count }) => ({ label, count }))} caption="Profiles by current review state" />
      <ChartPanel title="Age groups" kind="donut" data={points(age)} />
      <ChartPanel title="Youth classification" kind="horizontal" data={points(classification)} />
      <ChartPanel title="Work status" kind="horizontal" data={points(workStatus)} />
      <ChartPanel title="Civic participation" kind="horizontal" data={civicCounts} caption="Members reporting yes for each activity" />
      {coverageRankings.length ? coverageRankings.map((group) => <ChartPanel key={group.title} title={group.title} kind="horizontal" data={points(group.items)} caption="Highest coverage areas shown" />) : <ChartPanel title="Coverage" kind="horizontal" data={[]} />}
      <section className={panel}><div className="mb-2 flex items-start justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-slate-200">Certificate output · {periodLabel}</h2><span className="text-[10px] text-slate-500">By type</span></div><KkAnalyticsCharts kind="donut" data={points(certificateTypes)} label={`Certificates by type, ${periodLabel}`} /><div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-xs"><div><b className="text-lg tabular-nums text-white">{periodCertificates}</b><p className="text-slate-400">Issued in period</p></div><div><b className="text-lg tabular-nums text-white">{revoked}</b><p className="text-slate-400">Revoked · all time</p></div></div></section>
      <section className={panel}><div className="mb-2 flex items-start justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-slate-200">Data quality</h2><span className="text-[10px] text-slate-500">Records needing attention</span></div><KkAnalyticsCharts kind="horizontal" data={qualityCounts} label="Data quality gaps" /><div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-800 pt-2">{warnings.length ? warnings.map((item) => <span key={item.label} className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">{item.value} {item.label.toLowerCase()}</span>) : <span className="text-[11px] text-slate-500">No recorded quality warnings</span>}</div></section>
    </div>

    <div className="grid gap-3 lg:grid-cols-2"><section className={panel}><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[.12em]">Action insights</h2><span className="text-[10px] text-slate-500">Operations queue</span></div>{insights.length ? <ul className="divide-y divide-slate-800">{insights.slice(0, 4).map((item) => <li key={item.title} className="flex items-start justify-between gap-3 py-2 text-xs"><div className="min-w-0"><p className="font-semibold text-sky-300">{item.title}</p><p className="mt-0.5 text-slate-400">{item.detail}</p></div><b className="shrink-0 tabular-nums text-white">{item.value}</b></li>)}</ul> : <p className="text-xs text-slate-500">No action insights in this scope.</p>}</section>
      <section className={panel}><h2 className="text-xs font-bold uppercase tracking-[.12em]">Coverage watchlist</h2>{emptyAreas.length ? <ol className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">{emptyAreas.slice(0, 8).map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2 rounded-md bg-slate-900/70 px-2 py-1.5"><span className="text-slate-500">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 truncate text-slate-200" title={item.label}>{item.label}</span><span className="ml-auto text-slate-500">0</span></li>)}</ol> : <p className="mt-2 text-xs text-slate-500">No areas without profiles in this scope.</p>}<p className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-500">YouthPass eligible: {youthPass[0]?.value ?? "0"} · Public checks: {youthPass[3]?.value ?? "0"}</p></section></div>
  </div><KkAnalyticsPrintReport data={report} generatedAt={generatedAt} /></>;
}
