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
import { orientalMindoroMunicipalitiesGeoJson } from "@/data/oriental-mindoro-municipalities";
import { getOrientalMindoroLgus } from "@/data/oriental-mindoro-locations";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

const ORIENTAL_MINDORO_MUNICIPALITIES = [
  "Puerto Galera",
  "San Teodoro",
  "Baco",
  "City of Calapan",
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
  barangayCount: number;
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

type GeoJsonFeature = (typeof orientalMindoroMunicipalitiesGeoJson.features)[number];
type Position = [number, number];

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function getFeatureRings(feature: GeoJsonFeature): Position[][] {
  const geometry = feature.geometry as {
    type?: unknown;
    coordinates?: unknown;
  };

  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    return [];
  }

  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;

  if (!Array.isArray(polygons)) return [];

  const rings: Position[][] = [];
  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) continue;
    for (const ring of polygon) {
      if (!Array.isArray(ring)) continue;
      const validPositions = ring.filter(isPosition);
      if (validPositions.length >= 2) rings.push(validPositions);
    }
  }

  return rings;
}

function getAllPositions(feature: GeoJsonFeature): Position[] {
  return getFeatureRings(feature).flatMap((ring) => ring);
}

const boundaryCoordinates = orientalMindoroMunicipalitiesGeoJson.features.flatMap(getAllPositions);

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
  return getFeatureRings(feature)
    .map((ring) => {
      const projected = ring.map(projectBoundaryPoint);
      return `M ${projected.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} Z`;
    })
    .join(" ");
};

const geometryCenter = (feature: GeoJsonFeature) => {
  const points = getAllPositions(feature);
  if (points.length === 0) return null;

  const center = points.reduce(
    (sum, point) => [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length],
    [0, 0],
  ) as [number, number];
  return projectBoundaryPoint(center);
};

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const normalizeMunicipalityName = (value: string | null | undefined) =>
  value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

const MUNICIPALITY_ALIASES: Record<string, MunicipalityName> = {
  "calapan city": "City of Calapan",
  "city of calapan": "City of Calapan",
};

const canonicalizeMunicipalityName = (value: string | null | undefined) => {
  const normalized = normalizeMunicipalityName(value);
  if (!normalized) return undefined;

  return (
    MUNICIPALITY_ALIASES[normalized] ??
    ORIENTAL_MINDORO_MUNICIPALITIES.find(
      (name) => normalizeMunicipalityName(name) === normalized,
    )
  );
};

const canonicalBoundaryName = (name: string) =>
  canonicalizeMunicipalityName(name) ?? name;

const toPercent = (value: number | null) => (value === null ? "N/A" : `${value}%`);

const barangayCountByMunicipality = new Map(
  getOrientalMindoroLgus().map((lgu) => [lgu.name, lgu.barangayCount]),
);

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
  const municipalityQueryNames = [
    ...canonicalNames,
    ...Object.keys(MUNICIPALITY_ALIASES),
  ];
  const municipalityRecords = await prisma.municipality.findMany({
    where: {
      OR: municipalityQueryNames.map((name) => ({
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
      canonicalizeMunicipalityName(municipality.name) ??
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
              in: municipalityQueryNames,
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
                in: municipalityQueryNames,
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
      barangayCount: barangayCountByMunicipality.get(name) ?? 0,
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

  for (const [alias, canonicalName] of Object.entries(MUNICIPALITY_ALIASES)) {
    normalizedToCanonicalName.set(alias, canonicalName);
  }

  const resolveName = (
    municipalityId: string | null | undefined,
    municipalityName?: string | null,
  ) =>
    (municipalityId ? idToCanonicalName.get(municipalityId) : undefined) ??
    normalizedToCanonicalName.get(normalizeMunicipalityName(municipalityName)) ??
    canonicalizeMunicipalityName(municipalityName);

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
  const totalBarangays = municipalities.reduce(
    (total, municipality) => total + municipality.barangayCount,
    0,
  );
  const mappedMunicipalities = municipalities.filter(
    (municipality) => municipality.databaseId !== null,
  ).length;

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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <article className="overflow-hidden rounded-2xl border border-sky-300/15 bg-[#071427] shadow-[0_24px_60px_-32px_rgba(8,47,73,0.85)]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-200/10 bg-[linear-gradient(120deg,rgba(14,165,233,0.16),rgba(15,23,42,0.34)_42%,rgba(20,184,166,0.08))] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
                GeoMap Overview
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Oriental Mindoro command center
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100/70">
                Satellite-style overview of municipality-level governance coverage,
                official admissions, and system activity.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
              <MapPinned className="h-4 w-4" />
              CSS-only map
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative overflow-hidden rounded-2xl border border-sky-200/15 bg-[radial-gradient(circle_at_18%_16%,rgba(56,189,248,0.24),transparent_24%),radial-gradient(circle_at_80%_78%,rgba(20,184,166,0.18),transparent_28%),linear-gradient(145deg,#020617,#082f49_48%,#031525)] p-3 shadow-inner sm:p-5">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(2,6,23,0.74))]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-200/10 to-transparent" />
              <div className="relative overflow-x-auto">
              <svg
                viewBox="0 0 1000 700"
                role="img"
                aria-label="Oriental Mindoro municipal boundary map with registered official counts"
                className="mx-auto min-w-[620px] w-full max-w-[980px] drop-shadow-[0_0_20px_rgba(56,189,248,0.16)]"
              >
                <title>Oriental Mindoro municipal analytics map</title>
                <defs>
                  <filter id="municipalityGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <pattern id="terrainLines" width="36" height="36" patternUnits="userSpaceOnUse">
                    <path
                      d="M 0 18 C 8 12, 16 24, 24 18 S 36 12, 36 18"
                      fill="none"
                      stroke="rgba(186,230,253,0.12)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="1000" height="700" fill="url(#terrainLines)" opacity="0.7" />
                {orientalMindoroMunicipalitiesGeoJson.features.map((feature) => {
                  const municipalityName = canonicalBoundaryName(feature.properties.name);
                  const municipality = municipalities.find((item) => item.name === municipalityName);
                  if (!municipality) return null;
                  const rings = getFeatureRings(feature);
                  const center = geometryCenter(feature);
                  if (rings.length === 0 || !center) return null;
                  const [labelX, labelY] = center;
                  const fillOpacity =
                    maxRegistered === 0
                      ? 0.18
                      : Math.max(0.18, municipality.registeredOfficials / maxRegistered);
                  return (
                    <a
                      key={feature.properties.sourceId}
                      href={`#municipality-${municipality.name.replaceAll(" ", "-").toLowerCase()}`}
                      className="group outline-none"
                    >
                      <path
                        d={geometryPath(feature)}
                        className="stroke-cyan-200/75 transition duration-200 group-hover:stroke-white group-hover:brightness-125 group-focus:stroke-white"
                        fill="rgb(14 165 233)"
                        fillOpacity={fillOpacity}
                        strokeWidth="1.8"
                        vectorEffect="non-scaling-stroke"
                        filter="url(#municipalityGlow)"
                        aria-label={`${municipality.name}: ${formatNumber(municipality.registeredOfficials)} registered officials`}
                      >
                        <title>{`${municipality.name}: ${formatNumber(municipality.registeredOfficials)} registered, ${formatNumber(municipality.approvedOfficials)} approved, ${formatNumber(municipality.pendingOfficials)} pending, ${formatNumber(municipality.barangayCount)} barangays`}</title>
                      </path>
                      <circle
                        cx={labelX}
                        cy={labelY - 15}
                        r={Math.max(4, Math.min(14, municipality.activityCount + municipality.approvedOfficials))}
                        className="fill-emerald-300/80 stroke-white/70 transition group-hover:fill-white"
                        strokeWidth="1"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        className="pointer-events-none fill-white text-[12px] font-semibold drop-shadow-[0_1px_2px_rgba(2,6,23,0.95)]"
                      >
                        {municipality.name.replace(" City", "")}
                      </text>
                      <text
                        x={labelX}
                        y={labelY + 15}
                        textAnchor="middle"
                        className="pointer-events-none fill-sky-100/80 text-[10px] font-medium"
                      >
                        {formatNumber(municipality.barangayCount)} brgys
                      </text>
                    </a>
                  );
                })}
              </svg>
              </div>
              <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100/75">
                <span>Satellite-style overview using CSS gradients and SVG boundaries.</span>
                <span>Map shows municipality-level governance data only. No live GPS tracking is active.</span>
              </div>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="rounded-xl border border-sky-200/15 bg-white/[0.06] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-sky-200/70">
                  LGU Coverage
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {mappedMunicipalities}/{municipalities.length}
                </p>
                <p className="mt-1 text-xs text-sky-100/65">
                  database matched municipalities
                </p>
              </div>
              <div className="rounded-xl border border-sky-200/15 bg-white/[0.06] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-sky-200/70">
                  Barangays
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatNumber(totalBarangays)}
                </p>
                <p className="mt-1 text-xs text-sky-100/65">
                  shown from Oriental Mindoro reference data
                </p>
              </div>
              <div className="rounded-xl border border-sky-200/15 bg-white/[0.06] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-sky-200/70">
                  Legend
                </p>
                <div className="mt-3 space-y-2 text-xs text-sky-100/75">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-8 rounded-full bg-sky-400/25 ring-1 ring-sky-200/50" />
                    Lower official count
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-8 rounded-full bg-sky-400/80 ring-1 ring-sky-100/80" />
                    Higher official count
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-300 ring-1 ring-white/70" />
                    Activity and approved official signal
                  </div>
                </div>
              </div>
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
                  <dt className="text-xs text-muted">Barangays</dt>
                  <dd className="font-semibold text-foreground">
                    {formatNumber(municipality.barangayCount)}
                  </dd>
                </div>
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
