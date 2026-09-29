import { AdmissionStatus } from "@prisma/client";

import { getOrientalMindoroLgus } from "@/data/oriental-mindoro-locations";
import { prisma } from "@/lib/db";

export const REPORT_TYPES = [
  { key: "provincial", title: "Provincial SK Operational Summary", description: "Province-wide recorded system activity and coverage." },
  { key: "municipality", title: "Municipality Activity Report", description: "Linked events and recorded attendance logs by municipality." },
  { key: "attendance", title: "Attendance Participation Report", description: "Recorded attendance logs only; no participation rate is inferred." },
  { key: "profiling", title: "Profiling Completion Report", description: "Current core profile completion and location linkage." },
  { key: "admissions", title: "Pending Admissions Report", description: "Current pending official admissions by municipality." },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]["key"];

export function parseReportType(value: string | string[] | undefined): ReportType {
  const candidate = typeof value === "string" ? value : "";
  return REPORT_TYPES.find((report) => report.key === candidate)?.key ?? "provincial";
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");

// Only aggregate counts leave this helper. IDs and database names are used solely for attribution.
export async function getPendingAdmissionsByMunicipality() {
  const [municipalities, groups] = await Promise.all([
    prisma.municipality.findMany({ select: { id: true, name: true } }),
    prisma.sKOfficial.groupBy({
      by: ["municipalityId"],
      where: { admissionStatus: AdmissionStatus.PENDING },
      _count: { _all: true },
    }),
  ]);

  const referenceNames = new Map<string, string>();
  for (const lgu of getOrientalMindoroLgus()) {
    referenceNames.set(normalize(lgu.name), lgu.name);
    for (const alias of lgu.aliases ?? []) referenceNames.set(normalize(alias), lgu.name);
  }
  const nameById = new Map(
    municipalities.map((municipality) => [municipality.id, referenceNames.get(normalize(municipality.name))]),
  );
  const counts = new Map(getOrientalMindoroLgus().map((lgu) => [lgu.name, 0]));
  let unattributed = 0;

  for (const group of groups) {
    const name = group.municipalityId ? nameById.get(group.municipalityId) : undefined;
    if (name) counts.set(name, (counts.get(name) ?? 0) + group._count._all);
    else unattributed += group._count._all;
  }

  return { counts, unattributed };
}
