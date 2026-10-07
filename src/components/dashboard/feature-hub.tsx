import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export type HubFeature = { title: string; description: string; href: string; badge?: string };

export function DashboardBackButton({ href, label, current = "Feature" }: { href: string; label: string; current?: string }) {
  return <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm"><Link href={href} className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 font-semibold text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ArrowLeft className="h-4 w-4" />{label}</Link><span className="text-muted" aria-hidden="true">/</span><span aria-current="page" className="font-medium text-foreground">{current}</span></nav>;
}

export function DashboardHubPage({ title, description, scope, features }: { title: string; description: string; scope: string; features: HubFeature[] }) {
  return <div className="space-y-6 text-foreground">
    <header className="rounded-2xl border border-glass-border bg-surface p-5 shadow-sm sm:p-7">
      <span className="rounded-full border border-glass-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-foreground">{scope}</span>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{description} Choose what you need.</p>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {features.map((feature) => <Link key={`${feature.href}:${feature.title}`} href={feature.href} className="group flex min-h-36 flex-col rounded-xl border border-glass-border bg-surface-elevated p-5 shadow-sm motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 hover:border-accent hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{feature.badge ?? scope}</span>
        <h2 className="mt-3 text-lg font-semibold text-foreground">{feature.title}</h2>
        <p className="mt-1 flex-1 text-sm text-muted">{feature.description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground">Open feature <ArrowUpRight className="h-4 w-4" /></span>
      </Link>)}
    </div>
  </div>;
}
