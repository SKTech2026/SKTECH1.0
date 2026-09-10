import ArchiveBinClient from "./archive-bin-client";

export default function AdminArchivePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Audit History
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Archive Bin</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Permanently terminated records are preserved here for transparency and audit history.
        </p>
      </section>

      <ArchiveBinClient />
    </div>
  );
}
