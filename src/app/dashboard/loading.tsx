export default function DashboardLoading() {
  return (
    <main aria-label="Loading dashboard" className="mx-auto w-full max-w-7xl animate-pulse space-y-5 px-4 py-6 motion-reduce:animate-none sm:px-6">
      <div className="h-8 w-44 rounded-xl bg-slate-400/20" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl border border-glass-border bg-surface-elevated/60" />)}
      </div>
      <div className="h-48 rounded-2xl border border-glass-border bg-surface-elevated/60" />
      <span className="sr-only">Loading dashboard…</span>
    </main>
  );
}
