export type KkAnalyticsRange = "month" | "quarter" | "year" | "all";

export const KK_ANALYTICS_RANGES: Array<{ value: KkAnalyticsRange; label: string }> = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

export function parseKkAnalyticsRange(value: string | string[] | undefined): KkAnalyticsRange {
  return typeof value === "string" && KK_ANALYTICS_RANGES.some((option) => option.value === value)
    ? value as KkAnalyticsRange
    : "all";
}

// Calendar periods use Philippine time (UTC+08:00), matching the portal's audience.
export function kkAnalyticsStart(range: KkAnalyticsRange, now = new Date()): Date | undefined {
  if (range === "all") return undefined;
  const local = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const firstMonth = range === "year" ? 0 : range === "quarter" ? Math.floor(month / 3) * 3 : month;
  return new Date(Date.UTC(year, firstMonth, 1) - 8 * 60 * 60 * 1000);
}
