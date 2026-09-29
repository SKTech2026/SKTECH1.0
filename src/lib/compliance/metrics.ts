import { AdmissionStatus, OfficialStatus, ProfileChangeRequestStatus, Role, UserStatus } from "@prisma/client";

import { getOrientalMindoroLgus } from "@/data/oriental-mindoro-locations";
import { prisma } from "@/lib/db";

export const COMPLIANCE_LIMITATION =
  "These indicators are based on recorded SKTECH system activity and profile data. They are not certified statutory compliance results.";

export const METRIC_DEFINITIONS = [
  "Registered officials: all SKOfficial records, regardless of admission or activity status.",
  "Approved officials: SKOfficial records with APPROVED admission status.",
  "Pending admissions: SKOfficial records with PENDING admission status.",
  "Active officials: SKOfficial records with ACTIVE registry status.",
  "Approved staff: STAFF users with APPROVED account status.",
  "Total events: all Event records; municipality totals include only events linked to a recognized Oriental Mindoro municipality.",
  "Recorded attendance logs: OfficialAttendance rows; municipality attribution follows the official's current linked municipality.",
  "Province LGU coverage: reference LGUs with a matching Municipality database record, out of all reference LGUs.",
  "Profile completion: officials with linked municipality and barangay, position, election date, and term end date, divided by registered officials.",
  "Municipality coverage: reference LGUs with at least one linked official, approved staff member, linked event, or attributed attendance log.",
  "Barangay coverage: reference barangays with at least one official linked to that barangay, divided by reference barangays.",
  "Missing location: officials without a recognized linked municipality or a barangay linked to that municipality; each official is counted once.",
  "Term dates: APPROVED and ACTIVE officials whose recorded term end is past or within the next 90 days; null term end is excluded.",
  "Pending profile change requests: OfficialProfileChangeRequest rows with PENDING status.",
  "Operational status: Recorded activity when a municipality has a linked event or attributed attendance log; Profiles only when it has linked officials or approved staff but no activity; No records otherwise.",
] as const;

const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");

export type MunicipalityMetric = {
  name: string;
  barangayCount: number;
  registeredOfficials: number;
  approvedOfficials: number;
  activeOfficials: number;
  approvedStaff: number;
  eventsLinked: number;
  attendanceLogs: number;
  missingLocationRecords: number;
  operationalStatus: "Recorded activity" | "Profiles only" | "No records";
};

export async function getComplianceMetrics() {
  const generatedAt = new Date();
  const referenceLgus = getOrientalMindoroLgus();
  const [municipalities, barangays, officials, staff, events, attendance, pendingProfileChanges] =
    await Promise.all([
      prisma.municipality.findMany({ select: { id: true, name: true } }),
      prisma.barangay.findMany({ select: { id: true, municipalityId: true, name: true } }),
      prisma.sKOfficial.findMany({
        select: {
          id: true,
          municipalityId: true,
          barangayId: true,
          admissionStatus: true,
          status: true,
          position: true,
          dateElected: true,
          termEnd: true,
        },
      }),
      prisma.user.findMany({
        where: { role: Role.STAFF, status: UserStatus.APPROVED },
        select: { municipalityPresidentId: true },
      }),
      prisma.event.groupBy({ by: ["municipalityId"], _count: { _all: true } }),
      prisma.officialAttendance.groupBy({ by: ["officialId"], _count: { _all: true } }),
      prisma.officialProfileChangeRequest.count({
        where: { status: ProfileChangeRequestStatus.PENDING },
      }),
    ]);

  const referenceByName = new Map<string, string>();
  for (const lgu of referenceLgus) {
    referenceByName.set(normalize(lgu.name), lgu.name);
    for (const alias of lgu.aliases ?? []) referenceByName.set(normalize(alias), lgu.name);
  }

  const municipalityNameById = new Map(
    municipalities
      .map((municipality) => [municipality.id, referenceByName.get(normalize(municipality.name))] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
  const dbIdsByName = new Set(municipalityNameById.values());
  const barangayById = new Map(barangays.map((barangay) => [barangay.id, barangay]));
  const rowsByName = new Map<string, MunicipalityMetric>(
    referenceLgus.map((lgu) => [
      lgu.name,
      {
        name: lgu.name,
        barangayCount: lgu.barangayCount,
        registeredOfficials: 0,
        approvedOfficials: 0,
        activeOfficials: 0,
        approvedStaff: 0,
        eventsLinked: 0,
        attendanceLogs: 0,
        missingLocationRecords: 0,
        operationalStatus: "No records" as const,
      },
    ]),
  );

  let approvedOfficials = 0;
  let pendingAdmissions = 0;
  let activeOfficials = 0;
  let completeProfiles = 0;
  let missingLocationOfficials = 0;
  let missingMunicipalityOfficials = 0;
  let termPast = 0;
  let termApproaching = 0;
  const coveredBarangays = new Set<string>();
  const officialMunicipalityById = new Map<string, string>();
  const approachingCutoff = new Date(generatedAt);
  approachingCutoff.setUTCDate(approachingCutoff.getUTCDate() + 90);

  for (const official of officials) {
    const name = official.municipalityId
      ? municipalityNameById.get(official.municipalityId)
      : undefined;
    const row = name ? rowsByName.get(name) : undefined;
    const barangay = official.barangayId ? barangayById.get(official.barangayId) : undefined;
    const validBarangay = Boolean(
      barangay && official.municipalityId && barangay.municipalityId === official.municipalityId &&
      name && referenceLgus.find((lgu) => lgu.name === name)?.barangays.some(
        (referenceName) => normalize(referenceName) === normalize(barangay.name),
      ),
    );

    if (name) officialMunicipalityById.set(official.id, name);
    if (row) row.registeredOfficials += 1;
    if (official.admissionStatus === AdmissionStatus.APPROVED) {
      approvedOfficials += 1;
      if (row) row.approvedOfficials += 1;
    }
    if (official.admissionStatus === AdmissionStatus.PENDING) pendingAdmissions += 1;
    if (official.status === OfficialStatus.ACTIVE) {
      activeOfficials += 1;
      if (row) row.activeOfficials += 1;
    }
    if (name && validBarangay && official.position && official.dateElected && official.termEnd) {
      completeProfiles += 1;
    }
    if (!name || !validBarangay) {
      missingLocationOfficials += 1;
      if (row) row.missingLocationRecords += 1;
    }
    if (!name) missingMunicipalityOfficials += 1;
    if (name && validBarangay && official.barangayId) coveredBarangays.add(official.barangayId);

    if (
      official.admissionStatus === AdmissionStatus.APPROVED &&
      official.status === OfficialStatus.ACTIVE &&
      official.termEnd
    ) {
      if (official.termEnd < generatedAt) termPast += 1;
      else if (official.termEnd <= approachingCutoff) termApproaching += 1;
    }
  }

  for (const user of staff) {
    const name = user.municipalityPresidentId
      ? municipalityNameById.get(user.municipalityPresidentId)
      : undefined;
    if (name) rowsByName.get(name)!.approvedStaff += 1;
  }

  let totalEvents = 0;
  let eventsMissingMunicipality = 0;
  for (const group of events) {
    totalEvents += group._count._all;
    const name = group.municipalityId ? municipalityNameById.get(group.municipalityId) : undefined;
    if (name) rowsByName.get(name)!.eventsLinked += group._count._all;
    else eventsMissingMunicipality += group._count._all;
  }

  let attendanceLogs = 0;
  for (const group of attendance) {
    attendanceLogs += group._count._all;
    const name = officialMunicipalityById.get(group.officialId);
    if (name) rowsByName.get(name)!.attendanceLogs += group._count._all;
  }

  const municipalityRows = [...rowsByName.values()].map((row) => ({
    ...row,
    operationalStatus: row.eventsLinked + row.attendanceLogs > 0
      ? "Recorded activity" as const
      : row.registeredOfficials + row.approvedStaff > 0
        ? "Profiles only" as const
        : "No records" as const,
  }));

  return {
    generatedAt: generatedAt.toISOString(),
    summary: {
      registeredOfficials: officials.length,
      approvedOfficials,
      pendingAdmissions,
      activeOfficials,
      approvedStaff: staff.length,
      totalEvents,
      attendanceLogs,
      provinceLguCoverage: dbIdsByName.size,
      provinceLguTotal: referenceLgus.length,
    },
    indicators: {
      completeProfiles,
      municipalityCoverage: municipalityRows.filter((row) => row.operationalStatus !== "No records").length,
      barangayCoverage: coveredBarangays.size,
      barangayTotal: referenceLgus.reduce((total, lgu) => total + lgu.barangayCount, 0),
      missingLocationOfficials,
      missingMunicipalityOfficials,
      eventsMissingMunicipality,
      termApproaching,
      termPast,
      pendingProfileChanges,
    },
    municipalities: municipalityRows,
  };
}
