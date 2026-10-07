import Link from "next/link";

import { KK_ANALYTICS_RANGES, type KkAnalyticsRange } from "@/lib/kk/analytics-range";

export default function KkAnalyticsRangeFilter({ range, pathname }: { range: KkAnalyticsRange; pathname: string }) {
  return <nav aria-label="Analytics date range" className="flex min-w-0 flex-wrap gap-1 rounded-lg border border-slate-700 bg-slate-900/80 p-1">
    {KK_ANALYTICS_RANGES.map((option) => <Link
      key={option.value}
      href={`${pathname}?range=${option.value}`}
      aria-current={range === option.value ? "page" : undefined}
      className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${range === option.value ? "bg-sky-500 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
    >{option.label}</Link>)}
  </nav>;
}
