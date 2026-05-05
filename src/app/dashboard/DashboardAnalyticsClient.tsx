"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DashboardAnalytics = {
  totals: {
    totalEvents: number;
    totalAttendance: number;
    activeCheckIns: number;
    uniqueOfficialsCount: number;
    averageAttendancePerEvent: number;
    checkedInCount: number;
    checkedOutCount: number;
    registeredOfficialsCount: number;
  };
  attendancePerEvent: Array<{
    eventId: string | null;
    eventTitle: string;
    count: number;
  }>;
  attendanceTrend: Array<{
    date: string;
    label: string;
    count: number;
  }>;
  mostActiveOfficial: {
    officialId: string;
    name: string;
    count: number;
  } | null;
  highestAttendanceEvent: {
    eventId: string | null;
    title: string;
    count: number;
  } | null;
  peakCheckInHour: {
    hour: number;
    label: string;
    count: number;
  } | null;
};

type DashboardAnalyticsClientProps = {
  analytics: DashboardAnalytics;
};

const axisTick = { fill: "var(--color-muted)", fontSize: 12 };
const tooltipStyle = {
  backgroundColor: "var(--color-surface-elevated)",
  border: "1px solid var(--color-glass-border)",
  borderRadius: "0.5rem",
  color: "var(--color-foreground)",
};
const tooltipLabelStyle = { color: "var(--color-muted)" };
const lineDotStyle = { r: 3, fill: "var(--color-accent)" };
const lineActiveDotStyle = { r: 5 };
const legendTextStyle = { color: "var(--color-muted)" };

const pieColors = [
  "var(--color-accent)",
  "color-mix(in oklab, var(--color-muted) 70%, var(--color-background))",
];

export default function DashboardAnalyticsClient({
  analytics,
}: DashboardAnalyticsClientProps) {
  const summaryCards = [
    {
      label: "Total Events",
      value: analytics.totals.totalEvents.toLocaleString(),
      hint: "Configured governance activities",
    },
    {
      label: "Total Attendance",
      value: analytics.totals.totalAttendance.toLocaleString(),
      hint: "All attendance records captured",
    },
    {
      label: "Active Check-Ins",
      value: analytics.totals.activeCheckIns.toLocaleString(),
      hint: "Officials currently checked in",
    },
    {
      label: "Unique Officials",
      value: analytics.totals.uniqueOfficialsCount.toLocaleString(),
      hint: "Distinct officials with attendance",
    },
    {
      label: "Average Attendance/Event",
      value: analytics.totals.averageAttendancePerEvent.toFixed(2),
      hint: "Average records per event",
    },
  ];

  const barData = analytics.attendancePerEvent.map((item) => ({
    name:
      item.eventTitle.length > 24
        ? `${item.eventTitle.slice(0, 24)}...`
        : item.eventTitle,
    fullName: item.eventTitle,
    count: item.count,
  }));

  const lineData = analytics.attendanceTrend.map((item) => ({
    label: item.label,
    count: item.count,
  }));

  const pieData = [
    { name: "Checked In", value: analytics.totals.checkedInCount },
    { name: "Checked Out", value: analytics.totals.checkedOutCount },
  ];

  const hasPieData = pieData.some((entry) => entry.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-glass-border bg-surface-elevated p-4 shadow-lg"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-muted">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-glass-border bg-surface-elevated p-5 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground">
            Attendance Per Event
          </h2>
          <p className="mt-1 text-sm text-muted">
            Event-level attendance volume.
          </p>
          <div className="mt-4 h-80">
            {barData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-sm text-muted">
                No event attendance data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-glass-border)" />
                  <XAxis dataKey="name" tick={axisTick} interval={0} angle={-18} textAnchor="end" height={64} />
                  <YAxis allowDecimals={false} tick={axisTick} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-surface-elevated p-5 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground">Attendance Trend</h2>
          <p className="mt-1 text-sm text-muted">
            Daily attendance trajectory over time.
          </p>
          <div className="mt-4 h-80">
            {lineData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-sm text-muted">
                No trend data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-glass-border)" />
                  <XAxis dataKey="label" tick={axisTick} />
                  <YAxis allowDecimals={false} tick={axisTick} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    dot={lineDotStyle}
                    activeDot={lineActiveDotStyle}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-glass-border bg-surface-elevated p-5 shadow-lg xl:col-span-1">
          <h2 className="text-lg font-semibold text-foreground">
            Check-In Status Distribution
          </h2>
          <p className="mt-1 text-sm text-muted">
            Current split of checked-in vs checked-out records.
          </p>
          <div className="mt-4 h-72">
            {!hasPieData ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-sm text-muted">
                No status data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Legend wrapperStyle={legendTextStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-surface-elevated p-5 shadow-lg xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Operational Insights</h2>
          <p className="mt-1 text-sm text-muted">
            Key governance attendance indicators.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Most Active Official
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {analytics.mostActiveOfficial
                  ? analytics.mostActiveOfficial.name
                  : "No attendance data"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {analytics.mostActiveOfficial
                  ? `${analytics.mostActiveOfficial.count} attendance records`
                  : "Awaiting attendance entries"}
              </p>
            </div>

            <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Highest Attendance Event
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {analytics.highestAttendanceEvent
                  ? analytics.highestAttendanceEvent.title
                  : "No attendance data"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {analytics.highestAttendanceEvent
                  ? `${analytics.highestAttendanceEvent.count} records`
                  : "No event attendance yet"}
              </p>
            </div>

            <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Peak Check-In Hour
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {analytics.peakCheckInHour
                  ? analytics.peakCheckInHour.label
                  : "No check-ins yet"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {analytics.peakCheckInHour
                  ? `${analytics.peakCheckInHour.count} check-ins`
                  : "Awaiting check-in data"}
              </p>
            </div>

            <div className="rounded-lg border border-glass-border bg-surface-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Registered Officials
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {analytics.totals.registeredOfficialsCount.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-muted">
                Officials currently listed in governance registry
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
