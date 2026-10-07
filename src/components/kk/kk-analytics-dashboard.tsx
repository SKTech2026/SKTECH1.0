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

type KkAnalyticsDashboardProps = {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string; detail: string }>;
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

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-black text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  );
}

function DistributionList({ title, items, emptyMessage }: { title: string; items: DistributionItem[]; emptyMessage?: string }) {
  const hasData = items.length > 0 && items.some((item) => item.count > 0);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
      </div>
      {!hasData ? (
        <p className="text-sm text-muted">{emptyMessage ?? "No data available yet."}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const width = Math.min(MAX_BAR, Math.max(8, item.percentage || (item.count > 0 ? 10 : 0)));
            return (
              <div key={`${title}-${item.label}`}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{item.label}</span>
                  <span className="font-semibold text-muted">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KkAnalyticsDashboard({
  title,
  subtitle,
  stats,
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
    <div className="space-y-7">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">KK Analytics</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">Overview</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {youthPass.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-foreground">{item.value}</p>
              <p className="mt-2 text-sm text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Demographics</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {demographics.map((group) => (
            <DistributionList key={group.title} title={group.title} items={group.items} emptyMessage={emptyMessage} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Civic Participation</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {civic.map((group) => (
            <DistributionList key={group.title} title={group.title} items={group.items} emptyMessage={emptyMessage} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Coverage</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {coverage.map((group) => (
            <DistributionList key={group.title} title={group.title} items={group.items} emptyMessage={emptyMessage} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Certificates</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {certificates.map((group) => (
            <DistributionList key={group.title} title={group.title} items={group.items} emptyMessage={emptyMessage} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Data Quality</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quality.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-foreground">{item.value}</p>
              <p className="mt-2 text-sm text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Action Insights</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insights.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
              No action insights available yet.
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{insight.title}</p>
                <p className="mt-3 text-3xl font-black text-foreground">{insight.value}</p>
                <p className="mt-2 text-sm text-muted">{insight.detail}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
