type DistributionItem = {
  label: string;
  count: number;
  percentage: number;
};

type Insight = {
  title: string;
  value: string;
  detail: string;
};

type StatusBreakdownItem = {
  label: string;
  count: number;
  color: string;
};

type KkAnalyticsDashboardProps = {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string; detail: string }>;
  statusBreakdown?: StatusBreakdownItem[];
  demographics: { title: string; items: DistributionItem[]; }[];
  civic: { title: string; items: DistributionItem[]; }[];
  coverage: { title: string; items: DistributionItem[]; }[];
  youthPass: Array<{ label: string; value: string; detail: string }>;
  certificates: { title: string; items: DistributionItem[]; }[];
  quality: Array<{ label: string; value: string; detail: string }>;
  insights: Insight[];
  emptyMessage?: string;
};

const MAX_BAR = 100;

function formatCompactValue(value: string) {
  return value.length > 6 ? value.slice(0, 6) : value;
}

function CompactStatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-black leading-none text-white">{formatCompactValue(value)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function DistributionRow({ item, title }: { item: DistributionItem; title: string }) {
  const width = Math.min(MAX_BAR, Math.max(8, item.percentage || (item.count > 0 ? 10 : 0)));
  return (
    <div key={`${title}-${item.label}`} className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="truncate text-slate-200">{item.label}</span>
        <span className="font-semibold text-slate-400">{item.count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DistributionPanel({ title, items, emptyMessage }: { title: string; items: DistributionItem[]; emptyMessage?: string }) {
  const hasData = items.length > 0 && items.some((item) => item.count > 0);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">{title}</h3>
      {!hasData ? (
        <p className="text-xs text-slate-400">{emptyMessage ?? "No data available yet."}</p>
      ) : (
        <div className="space-y-3">{items.slice(0, 6).map((item) => <DistributionRow key={`${title}-${item.label}`} item={item} title={title} />)}</div>
      )}
    </div>
  );
}

function StatusBarPanel({ items }: { items: StatusBreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const filtered = items.filter((item) => item.count > 0);

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 text-xs text-slate-400 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
        No profile status data available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Registration status</h3>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{total} total</span>
      </div>
      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-slate-800">
        {filtered.map((item) => (
          <div
            key={item.label}
            className={`h-full ${item.color}`}
            style={{ width: `${total ? (item.count / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-1.5 text-[11px]">
            <span className="flex items-center gap-2 text-slate-300">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
            <span className="font-semibold text-white">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 text-xs text-slate-400 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
        No action insights available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Action insights</h3>
      <div className="space-y-2">
        {insights.slice(0, 6).map((insight) => (
          <div key={insight.title} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300">{insight.title}</span>
              <span className="text-sm font-bold text-white">{insight.value}</span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">{insight.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KkAnalyticsDashboard({
  title,
  subtitle,
  stats,
  statusBreakdown = [],
  demographics,
  civic,
  coverage,
  youthPass,
  certificates,
  quality,
  insights,
  emptyMessage = "No data available yet.",
}: KkAnalyticsDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_14px_28px_-22px_rgba(15,23,42,0.7)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">KK Analytics</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h1>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">{subtitle}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {stats.map((item) => (
          <CompactStatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <StatusBarPanel items={statusBreakdown} />
        </div>

        <div className="xl:col-span-3">
          <DistributionPanel title="YouthPass" items={youthPass.map((item) => ({ label: item.label, count: Number(item.value || 0), percentage: Number(item.value || 0) }))} emptyMessage={emptyMessage} />
        </div>

        <div className="xl:col-span-3">
          <DistributionPanel title="Certificate output" items={certificates.flatMap((group) => group.items).slice(0, 6)} emptyMessage={emptyMessage} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {demographics.slice(0, 2).map((group) => (
          <div key={group.title} className="xl:col-span-3">
            <DistributionPanel title={group.title} items={group.items} emptyMessage={emptyMessage} />
          </div>
        ))}

        {civic.slice(0, 2).map((group) => (
          <div key={group.title} className="xl:col-span-3">
            <DistributionPanel title={group.title} items={group.items} emptyMessage={emptyMessage} />
          </div>
        ))}

        <div className="xl:col-span-3">
          <DistributionPanel title="Coverage snapshot" items={coverage.flatMap((group) => group.items).slice(0, 6)} emptyMessage={emptyMessage} />
        </div>

        <div className="xl:col-span-3">
          <DistributionPanel title="Data quality" items={quality.map((item) => ({ label: item.label, count: Number(item.value || 0), percentage: Number(item.value || 0) }))} emptyMessage={emptyMessage} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <DistributionPanel title="Age groups" items={demographics[0]?.items ?? []} emptyMessage={emptyMessage} />
        </div>
        <div className="xl:col-span-4">
          <DistributionPanel title="Civic participation" items={civic.flatMap((group) => group.items).slice(0, 6)} emptyMessage={emptyMessage} />
        </div>
        <div className="xl:col-span-4">
          <InsightList insights={insights} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {coverage.map((group) => (
          <div key={group.title} className="xl:col-span-4">
            <DistributionPanel title={group.title} items={group.items} emptyMessage={emptyMessage} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {certificates.map((group) => (
          <div key={group.title} className="xl:col-span-4">
            <DistributionPanel title={group.title} items={group.items} emptyMessage={emptyMessage} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {quality.map((item) => (
          <div key={item.label} className="xl:col-span-3">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
