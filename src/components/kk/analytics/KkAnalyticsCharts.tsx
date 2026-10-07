"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type ChartPoint = { label: string; count: number };
type ChartKind = "status" | "donut" | "horizontal";

const colors = ["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#22d3ee"];
const statusColors: Record<string, string> = {
  Verified: "#34d399",
  Pending: "#fbbf24",
  "Needs correction": "#fb923c",
  Rejected: "#fb7185",
  Archived: "#94a3b8",
};
const tooltipStyle = { backgroundColor: "#0b1222", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", fontSize: 12 };

export default function KkAnalyticsCharts({ kind, data, label }: { kind: ChartKind; data: ChartPoint[]; label: string }) {
  const valid = data.filter((item) => Number.isFinite(item.count) && item.count >= 0);
  const points = kind === "donut" ? valid.filter((item) => item.count > 0) : valid;
  if (!points.some((item) => item.count > 0)) return <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-400">No data in this scope yet</div>;

  if (kind === "donut") {
    return <div role="img" aria-label={`${label}: ${points.map((item) => `${item.label} ${item.count}`).join(", ")}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
      <div className="h-44 min-w-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={points} dataKey="count" nameKey="label" innerRadius="56%" outerRadius="82%" paddingAngle={2} stroke="none">{points.map((item, index) => <Cell key={item.label} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div>
      <ul className="min-w-0 space-y-1.5 text-[11px]">{points.slice(0, 6).map((item, index) => <li key={item.label} className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate text-slate-300" title={item.label}>{item.label}</span><b className="tabular-nums text-white">{item.count}</b></li>)}</ul>
    </div>;
  }

  if (kind === "status") {
    return <div role="img" aria-label={`${label}: ${points.map((item) => `${item.label} ${item.count}`).join(", ")}`} className="h-48 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={points} margin={{ top: 6, right: 6, bottom: 22, left: -20 }}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-24} textAnchor="end" height={46} tickFormatter={(value: string) => value === "Needs correction" ? "Correction" : value} /><YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" name="Profiles" radius={[4, 4, 0, 0]} maxBarSize={34}>{points.map((item) => <Cell key={item.label} fill={statusColors[item.label] ?? "#38bdf8"} />)}</Bar></BarChart></ResponsiveContainer></div>;
  }

  const top = points.slice(0, 7);
  return <div role="img" aria-label={`${label}: ${top.map((item) => `${item.label} ${item.count}`).join(", ")}`} className="h-48 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={top} layout="vertical" margin={{ top: 4, right: 12, bottom: 2, left: 6 }}><CartesianGrid stroke="#1e293b" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><YAxis type="category" dataKey="label" width={94} tick={{ fill: "#cbd5e1", fontSize: 10 }} tickFormatter={(value: string) => value.length > 15 ? `${value.slice(0, 13)}…` : value} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" name="Members" fill="#38bdf8" radius={[0, 4, 4, 0]} maxBarSize={18} /></BarChart></ResponsiveContainer></div>;
}
