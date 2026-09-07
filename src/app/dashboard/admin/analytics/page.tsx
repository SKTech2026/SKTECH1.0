import { AdmissionStatus, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  MapPinned,
  ShieldCheck,
  Users,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";
import orientalMindoroBoundaries from "@/data/oriental-mindoro-municipalities.geojson";

export const dynamic = "force-dynamic";

const ORIENTAL_MINDORO_MUNICIPALITIES = [
  "Puerto Galera",
  "San Teodoro",
  "Baco",
  "Calapan City",
  "Naujan",
  "Victoria",
  "Socorro",
  "Pola",
  "Pinamalayan",
  "Gloria",
  "Bansud",
  "Bongabong",
  "Roxas",
  "Mansalay",
  "Bulalacao",
] as const;

type MunicipalityName = (typeof ORIENTAL_MINDORO_MUNICIPALITIES)[number];

type MunicipalityAnalytics = {
  name: MunicipalityName;
  databaseId: string | null;
  registeredOfficials: number;
  approvedOfficials: number;
  pendingOfficials: number;
  activeOfficials: number;
  staffCount: number;
  attendanceCount: number;
  eventCount: number;
  activityCount: number;
  activePercentage: number | null;
};

type GeoJsonFeature = (typeof orientalMindoroBoundaries.features)[number];

const canonicalBoundaryName = (name: string) =>
  name === "City of Calapan" ? "Calapan City" : name;

const boundaryCoordinates = orientalMindoroBoundaries.features.flatMap((feature) => {
  const coordinates = feature.geometry.coordinates as unknown;
  const points: [number, number][] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") {
      points.push([value[0], value[1]]);
      return;
    }
    if (Array.isArray(value)) value.forEach(collect);
  };
  collect(coordinates);
  return points;
});

const boundaryBounds = boundaryCoordinates.reduce(
  (bounds, [longitude, latitude]) => ({
    minLongitude: Math.min(bounds.minLongitude, longitude),
    maxLongitude: Math.max(bounds.maxLongitude, longitude),
    minLatitude: Math.min(bounds.minLatitude, latitude),
    maxLatitude: Math.max(bounds.maxLatitude, latitude),
  }),
  {
    minLongitude: Number.POSITIVE_INFINITY,
    maxLongitude: Number.NEGATIVE_INFINITY,
    minLatitude: Number.POSITIVE_INFINITY,
    maxLatitude: Number.NEGATIVE_INFINITY,
  },
);

const projectBoundaryPoint = ([longitude, latitude]: [number, number]) => {
  const width = boundaryBounds.maxLongitude - boundaryBounds.minLongitude;
  const height = boundaryBounds.maxLatitude - boundaryBounds.minLatitude;
  return [
    40 + ((longitude - boundaryBounds.minLongitude) / width) * 920,
    40 + ((boundaryBounds.maxLatitude - latitude) / height) * 620,
  ] as const;
};

const geometryPath = (feature: GeoJsonFeature) => {
  const commands: string[] = [];
  const collectRing = (ring: unknown) => {
    if (!Array.isArray(ring) || ring.length === 0) return;
    const points = ring as [number, number][];
    const projected = points.map(projectBoundaryPoint);
    commands.push(`M ${projected.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} Z`);
  };
  const collect = (value: unknown, depth = 0) => {
    if (depth === 2) {
      collectRing(value);
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => collect(item, depth + 1));
  };
  collect(feature.geometry.coordinates);
  return commands.join(" ");
};

const geometryCenter = (feature: GeoJsonFeature) => {
  const points: [number, number][] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") {
      points.push([value[0], value[1]]);
      return;
    }
    if (Array.isArray(value)) value.forEach(collect);
  };
  collect(feature.geometry.coordinates);
  const center = points.reduce(
    (sum, point) => [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length],
    [0, 0],
  ) as [number, number];
  return projectBoundaryPoint(center);
};

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const normalizeMunicipalityName = (value: string | null | undefined) =>
  value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

const toPercent = (value: number | null) => (value === null ? "N/A" : `${value}%`);

const getIntensityClass = (count: number, max: number) => {
  if (max === 0 || count === 0) {
    return "border-glass-border bg-surface-elevated/40 text-muted";
  }
  const ratio = count / max;
  if (ratio >= 0.75) return "border-accent/60 bg-accent/25 text-foreground";
  if (ratio >= 0.45) return "border-accent/45 bg-accent/18 text-foreground";
  return "border-accent/30 bg-accent/10 text-foreground";
};

async function getMunicipalityAnalytics() {
  const canonicalNames = ORIENTAL_MINDORO_MUNICIPALITIES;
  const municipalityRecords = await prisma.municipality.findMany({
    where: {
      OR: canonicalNames.map((name) => ({
        name: {
          equals: name,
          mode: "insensitive" as const,
        },
      })),
    },
    select: {
      id: true,
      name: true,
    },
  });

  const municipalityByName = new Map(
    municipalityRecords.map((municipality) => [
      normalizeMunicipalityName(municipality.name),
      municipality,
    ]),
  );
  const ids = municipalityRecords.map((municipality) => municipality.id);

  const [
    officialRecords,
    staffUsers,
    attendanceRecords,
    eventRecords,
    totalUsers,
    totalOfficialUsers,
    totalStaffUsers,
    approvedUsers,
    pendingUsers,
  ] = await Promise.all([
    prisma.sKOfficial.findMany({
      where: {
        OR: [
          { municipalityId: { in: ids.length > 0 ? ids : ["__none__"] } },
          {
            municipality: {
              in: [...canonicalNames],
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        municipalityId: true,
        municipality: true,
        admissionStatus: true,
        status: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: Role.STAFF,
        municipalityPresidentId: { in: ids.length > 0 ? ids : ["__none__"] },
      },
      select: {
        municipalityPresidentId: true,
      },
    }),
    prisma.officialAttendance.findMany({
      where: {
        official: {
          OR: [
            { municipalityId: { in: ids.length > 0 ? ids : ["__none__"] } },
            {
              municipality: {
                in: [...canonicalNames],
                mode: "insensitive",
              },
            },
          ],
        },
      },
      select: {
        official: {
          select: {
            municipalityId: true,
            municipality: true,
          },
        },
      },
    }),
    prisma.event.findMany({
      where: {
        municipalityId: { in: ids.length > 0 ? ids : ["__none__"] },
      },
      select: {
        municipalityId: true,
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.OFFICIAL } }),
    prisma.user.count({ where: { role: Role.STAFF } }),
    prisma.user.count({ where: { status: UserStatus.APPROVED } }),
    prisma.user.count({ where: { status: UserStatus.PENDING } }),
  ]);

  const analyticsByName = new Map<MunicipalityName, MunicipalityAnalytics>();
  const idToCanonicalName = new Map<string, MunicipalityName>();
  const normalizedToCanonicalName = new Map<string, MunicipalityName>();

  for (const name of canonicalNames) {
    const municipality = municipalityByName.get(normalizeMunicipalityName(name));
    if (municipality) idToCanonicalName.set(municipality.id, name);
    normalizedToCanonicalName.set(normalizeMunicipalityName(name), name);

    analyticsByName.set(name, {
      name,
      databaseId: municipality?.id ?? null,
      registeredOfficials: 0,
      approvedOfficials: 0,
      pendingOfficials: 0,
      activeOfficials: 0,
      staffCount: 0,
      attendanceCount: 0,
      eventCount: 0,
      activityCount: 0,
      activePercentage: null,
    });
  }

  const resolveName = (
    municipalityId: string | null | undefined,
    municipalityName?: string | null,
  ) =>
    (municipalityId ? idToCanonicalName.get(municipalityId) : undefined) ??
    normalizedToCanonicalName.get(normalizeMunicipalityName(municipalityName));

  for (const official of officialRecords) {
    const name = resolveName(official.municipalityId, official.municipality);
    if (!name) continue;

    const item = analyticsByName.get(name);
    if (!item) continue;

    item.registeredOfficials += 1;
    if (official.admissionStatus === AdmissionStatus.APPROVED) item.approvedOfficials += 1;
    if (official.admissionStatus === AdmissionStatus.PENDING) item.pendingOfficials += 1;
    if (official.status === OfficialStatus.ACTIVE) item.activeOfficials += 1;
  }

  for (const staff of staffUsers) {
    const name = resolveName(staff.municipalityPresidentId);
    const item = name ? analyticsByName.get(name) : null;
    if (item) item.staffCount += 1;
  }

  for (const attendance of attendanceRecords) {
    const name = resolveName(
      attendance.official.municipalityId,
      attendance.official.municipality,
    );
    const item = name ? analyticsByName.get(name) : null;
    if (item) item.attendanceCount += 1;
  }

  for (const event of eventRecords) {
    const name = resolveName(event.municipalityId);
    const item = name ? analyticsByName.get(name) : null;
    if (item) item.eventCount += 1;
  }

  const municipalities = Array.from(analyticsByName.values()).map((item) => {
    const activityCount = item.attendanceCount + item.eventCount;
    // Activity is existing system activity only: official attendance records plus municipality-linked events.
    const activePercentage =
      item.registeredOfficials === 0
        ? null
        : Math.round((item.activeOfficials / item.registeredOfficials) * 100);

    return {
      ...item,
      activityCount,
      activePercentage,
    };
  });

  const highestRegisteredMunicipality =
    [...municipalities].sort(
      (a, b) =>
        b.registeredOfficials +
        b.staffCount -
        (a.registeredOfficials + a.staffCount) ||
        a.name.localeCompare(b.name),
    )[0] ?? null;
  const highestActivityMunicipality =
    [...municipalities].sort(
      (a, b) => b.activityCount - a.activityCount || a.name.localeCompare(b.name),
    )[0] ?? null;

  return {
    municipalities,
    summary: {
      totalUsers,
      totalOfficialUsers,
      totalStaffUsers,
      approvedUsers,
      pendingUsers,
      highestRegisteredMunicipality,
      highestActivityMunicipality,
    },
  };
}

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);

  const { municipalities, summary } = await getMunicipalityAnalytics();
  const maxRegistered = Math.max(
    ...municipalities.map((municipality) => municipality.registeredOfficials),
    0,
  );
  const maxActivity = Math.max(
    ...municipalities.map((municipality) => municipality.activityCount),
    0,
  );
  const mostActiveMunicipalities = [...municipalities]
    .sort((a, b) => b.activityCount - a.activityCount || a.name.localeCompare(b.name))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-[0_24px_48px_-28px_var(--shadow-color)]">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Oriental Mindoro Analytics
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Municipality Analytics Map
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Admin-only operational view of registered users and system activity by
              municipality. This is a stylized analytics panel, not live GPS tracking.
            </p>
          </div>

          <div className="grid min-w-[240px] grid-cols-2 gap-3 rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
            <div>
              <p className="text-xs text-muted">Registered users</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatNumber(summary.totalUsers)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Activity records</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatNumber(
                  municipalities.reduce((total, item) => total + item.activityCount, 0),
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total SK Officials",
            value: summary.totalOfficialUsers,
            Icon: Users,
          },
          {
            label: "Total Staff",
            value: summary.totalStaffUsers,
            Icon: ShieldCheck,
          },
          {
            label: "Approved Users",
            value: summary.approvedUsers,
            Icon: CheckCircle2,
          },
          {
            label: "Pending Users",
            value: summary.pendingUsers,
            Icon: BarChart3,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_18px_36px_-26px_var(--shadow-color)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-accent">
                  {formatNumber(metric.value)}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/65 text-muted">
                <metric.Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Map Style
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Oriental Mindoro municipality coverage
              </h3>
            </div>
            <MapPinned className="h-5 w-5 text-accent" />
          </div>

          <div className="mt-5 rounded-[2rem] border border-glass-border bg-surface-elevated/35 p-4">
            <div className="overflow-x-auto rounded-[1.5rem] border border-glass-border bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent_42%),linear-gradient(180deg,var(--color-surface),var(--color-surface-elevated))] p-3 sm:p-5">
              <svg
                viewBox="0 0 1000 700"
                role="img"
                aria-label="Oriental Mindoro municipal boundary map with registered official counts"
                className="mx-auto min-w-[620px] w-full max-w-[980px]"
              >
                <title>Oriental Mindoro municipal analytics map</title>
                {orientalMindoroBoundaries.features.map((feature) => {
                  const municipalityName = canonicalBoundaryName(feature.properties.name);
                  const municipality = municipalities.find((item) => item.name === municipalityName);
                  if (!municipality) return null;
                  const [labelX, labelY] = geometryCenter(feature);
                  return (
                    <a
                      key={feature.properties.sourceId}
                      href={`#municipality-${municipality.name.replaceAll(" ", "-").toLowerCase()}`}
                    >
                      <path
                        d={geometryPath(feature)}
                        className="stroke-accent/70 transition hover:brightness-125"
                        fill="var(--color-accent)"
                        fillOpacity={maxRegistered === 0 ? 0.08 : Math.max(0.08, municipality.registeredOfficials / maxRegistered)}
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        aria-label={`${municipality.name}: ${formatNumber(municipality.registeredOfficials)} registered officials`}
                      >
                        <title>{`${municipality.name}: ${formatNumber(municipality.registeredOfficials)} registered, ${formatNumber(municipality.activityCount)} activity records`}</title>
                      </path>
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        className="pointer-events-none fill-foreground text-[13px] font-semibold"
                      >
                        {municipality.name.replace(" City", "")}
                      </text>
                    </a>
                  );
                })}
              </svg>
              <p className="mt-2 text-center text-xs text-muted">
                Real municipal boundaries from geoBoundaries ADM3 data. Fill intensity reflects live registered official counts.
              </p>
              <p className="mt-1 text-center text-xs text-muted">
                Map boundaries are based on geoBoundaries ADM3 data. Activity indicators use SKTECH system records only, not GPS tracking, and are not a claim of exact legal GIS boundary accuracy.
              </p>
            </div>
          </div>
        </article>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  Most Active Municipalities
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Activity ranking
                </h3>
              </div>
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-5 space-y-3">
              {mostActiveMunicipalities.map((municipality, index) => (
                <div
                  key={municipality.name}
                  className="rounded-xl border border-glass-border bg-surface-elevated/45 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {index + 1}. {municipality.name}
                    </p>
                    <span className="text-sm font-bold text-accent">
                      {formatNumber(municipality.activityCount)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width:
                          maxActivity === 0
                            ? "0%"
                            : `${Math.max(8, (municipality.activityCount / maxActivity) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {formatNumber(municipality.attendanceCount)} attendance,{" "}
                    {formatNumber(municipality.eventCount)} events
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              User Activity Overview
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              System activity only
            </h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
                <p className="text-muted">Highest registered users</p>
                <p className="mt-1 font-semibold text-foreground">
                  {summary.highestRegisteredMunicipality
                    ? summary.highestRegisteredMunicipality.name
                    : "Not available yet"}
                </p>
              </div>
              <div className="rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
                <p className="text-muted">Highest activity</p>
                <p className="mt-1 font-semibold text-foreground">
                  {summary.highestActivityMunicipality &&
                  summary.highestActivityMunicipality.activityCount > 0
                    ? summary.highestActivityMunicipality.name
                    : "Not available yet"}
                </p>
              </div>
              <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-foreground">
                No live location, GPS coordinates, hidden tracking, or private real-time
                movement data is collected or displayed here.
              </p>
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-[0_18px_36px_-26px_var(--shadow-color)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Registered Users by Municipality
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Official, staff, and activity counts
            </h3>
          </div>
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {municipalities.map((municipality) => (
            <article
              id={`municipality-${municipality.name.replaceAll(" ", "-").toLowerCase()}`}
              key={municipality.name}
              className="rounded-xl border border-glass-border bg-surface-elevated/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-base font-semibold text-foreground">
                    {municipality.name}
                  </h4>
                  <p className="mt-1 text-xs text-muted">
                    {municipality.databaseId
                      ? "Matched to municipality record"
                      : "Municipality record not available yet"}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${getIntensityClass(
                    municipality.activityCount,
                    maxActivity,
                  )}`}
                >
                  {formatNumber(municipality.activityCount)} active
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Registered</dt>
                  <dd className="font-semibold text-foreground">
                    {formatNumber(municipality.registeredOfficials)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Approved</dt>
                  <dd className="font-semibold text-foreground">
                    {formatNumber(municipality.approvedOfficials)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Pending</dt>
                  <dd className="font-semibold text-foreground">
                    {formatNumber(municipality.pendingOfficials)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Staff</dt>
                  <dd className="font-semibold text-foreground">
                    {formatNumber(municipality.staffCount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Attendance</dt>
                  <dd className="font-semibold text-foreground">
                    {formatNumber(municipality.attendanceCount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Active rate</dt>
                  <dd className="font-semibold text-foreground">
                    {toPercent(municipality.activePercentage)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
