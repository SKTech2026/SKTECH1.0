export default function MobileLoading() {
  return (
    <main aria-label="Loading mobile page" className="mx-auto w-full max-w-md animate-pulse space-y-4 px-3 py-5 motion-reduce:animate-none">
      <div className="h-8 w-40 rounded-xl bg-slate-400/20" />
      <div className="h-32 rounded-2xl border border-glass-border bg-surface-elevated/60" />
      <div className="h-24 rounded-2xl border border-glass-border bg-surface-elevated/60" />
      <span className="sr-only">Loading mobile page…</span>
    </main>
  );
}
