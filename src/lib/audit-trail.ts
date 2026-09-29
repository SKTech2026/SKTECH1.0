import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";

export const AUDIT_PAGE_SIZE = 25;

export const AUDIT_CATEGORIES = [
  { value: "official_profile", label: "Official admission / profile" },
  { value: "official_decision", label: "Official decisions / status" },
  { value: "staff_termination", label: "Staff termination" },
  { value: "profile_change", label: "Profile change decisions" },
  { value: "face_registration", label: "Face registration" },
  { value: "face_attendance", label: "Face-verified attendance" },
  { value: "mobile_session", label: "Mobile session activity" },
] as const;

export const AUDIT_TARGETS = [
  { value: "SKOfficial", label: "Official" },
  { value: "OfficialProfileChangeRequest", label: "Profile change request" },
  { value: "User", label: "Account" },
  { value: "OfficialAttendance", label: "Attendance" },
  { value: "MobileSession", label: "Mobile session" },
] as const;

type Category = (typeof AUDIT_CATEGORIES)[number]["value"];
type Target = (typeof AUDIT_TARGETS)[number]["value"];
export type AuditQuery = {
  from: string;
  to: string;
  category: Category | "";
  role: Role | "";
  municipalityId: string;
  target: Target | "";
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const ACTIONS: Record<Exclude<Category, "mobile_session">, readonly string[]> = {
  official_profile: [
    "SUBMIT_OFFICIAL_ADMISSION_WIZARD",
    "CREATE_WALKIN_OFFICIAL_PROFILE",
    "CREATE_ACCOUNT_OFFICIAL_PROFILE",
    "UPDATE_OFFICIAL_PROFILE",
  ],
  official_decision: [
    "APPROVE_OFFICIAL_ADMISSION",
    "REJECT_OFFICIAL_ADMISSION",
    "TERMINATE_OFFICIAL",
    "SET_OFFICIAL_ACTIVE",
    "SET_OFFICIAL_INACTIVE",
    "SET_OFFICIAL_TERMINATED",
  ],
  staff_termination: ["TERMINATE_STAFF"],
  profile_change: ["APPROVE_OFFICIAL_PROFILE_CHANGE", "REJECT_OFFICIAL_PROFILE_CHANGE"],
  face_registration: ["FACE_REGISTERED"],
  face_attendance: ["FACE_VERIFIED_ATTENDANCE_MARKED"],
};

const DETAILS: Record<string, { summary: string; category: string; target: string; source: string; level: string }> = {
  SUBMIT_OFFICIAL_ADMISSION_WIZARD: { summary: "Official admission submitted", category: "Official admission / profile", target: "Official", source: "Official admission", level: "Info" },
  CREATE_WALKIN_OFFICIAL_PROFILE: { summary: "Walk-in official profile created", category: "Official admission / profile", target: "Official", source: "Official profiles", level: "Info" },
  CREATE_ACCOUNT_OFFICIAL_PROFILE: { summary: "Official profile created", category: "Official admission / profile", target: "Official", source: "Official profiles", level: "Info" },
  UPDATE_OFFICIAL_PROFILE: { summary: "Official profile updated", category: "Official admission / profile", target: "Official", source: "Official profiles", level: "Info" },
  APPROVE_OFFICIAL_ADMISSION: { summary: "Official admission approved", category: "Official decisions / status", target: "Official", source: "Admission review", level: "Governance" },
  REJECT_OFFICIAL_ADMISSION: { summary: "Official admission rejected", category: "Official decisions / status", target: "Official", source: "Admission review", level: "Governance" },
  TERMINATE_OFFICIAL: { summary: "Official account terminated", category: "Official decisions / status", target: "Official", source: "Official access", level: "Governance" },
  SET_OFFICIAL_ACTIVE: { summary: "Official status set to active", category: "Official decisions / status", target: "Official", source: "Official access", level: "Governance" },
  SET_OFFICIAL_INACTIVE: { summary: "Official status set to inactive", category: "Official decisions / status", target: "Official", source: "Official access", level: "Governance" },
  SET_OFFICIAL_TERMINATED: { summary: "Official status set to terminated", category: "Official decisions / status", target: "Official", source: "Official access", level: "Governance" },
  TERMINATE_STAFF: { summary: "Staff account terminated", category: "Staff termination", target: "Account", source: "Staff access", level: "Governance" },
  APPROVE_OFFICIAL_PROFILE_CHANGE: { summary: "Official profile change approved", category: "Profile change decisions", target: "Profile change request", source: "Profile review", level: "Governance" },
  REJECT_OFFICIAL_PROFILE_CHANGE: { summary: "Official profile change rejected", category: "Profile change decisions", target: "Profile change request", source: "Profile review", level: "Governance" },
  FACE_REGISTERED: { summary: "Face registration recorded", category: "Face registration", target: "Account", source: "Face registration", level: "Info" },
  FACE_VERIFIED_ATTENDANCE_MARKED: { summary: "Face-verified attendance marked", category: "Face-verified attendance", target: "Attendance", source: "Face verification", level: "Info" },
};

const firstString = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : "";
};

export function parseAuditQuery(params: RawParams): AuditQuery {
  const from = validDate(firstString(params.from));
  const rawTo = validDate(firstString(params.to));
  const categoryValue = firstString(params.category);
  const roleValue = firstString(params.role);
  const targetValue = firstString(params.target);
  const pageValue = firstString(params.page);
  const page = /^\d+$/.test(pageValue) ? Number(pageValue) : 1;

  return {
    from,
    to: from && rawTo && rawTo < from ? "" : rawTo,
    category: AUDIT_CATEGORIES.some((item) => item.value === categoryValue) ? categoryValue as Category : "",
    role: Object.values(Role).includes(roleValue as Role) ? roleValue as Role : "",
    municipalityId: /^[a-zA-Z0-9_-]{1,64}$/.test(firstString(params.municipalityId)) ? firstString(params.municipalityId) : "",
    target: AUDIT_TARGETS.some((item) => item.value === targetValue) ? targetValue as Target : "",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
  };
}

export function auditPageHref(query: AuditQuery, page: number) {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.category) params.set("category", query.category);
  if (query.role) params.set("role", query.role);
  if (query.municipalityId) params.set("municipalityId", query.municipalityId);
  if (query.target) params.set("target", query.target);
  params.set("page", String(page));
  return `/dashboard/admin/audit-trail?${params.toString()}`;
}

export function describeAuditAction(action: string, model: string) {
  // Mobile values are accepted from the client. Never render their raw text as a trusted event.
  if (action.startsWith("MOBILE_") || model === "MobileSession") {
    return { summary: "Mobile session activity (client-submitted; unverified)", category: "Mobile session activity", target: "Mobile session", source: "Mobile client", level: "Unverified" };
  }
  // Names alone do not authenticate provenance: a mobile client can submit these names too.
  return Object.prototype.hasOwnProperty.call(DETAILS, action)
    ? DETAILS[action]
    : { summary: "Other recorded activity", category: "Other", target: "Other", source: "Unknown", level: "Unverified" };
}

export async function getAuditTrail(query: AuditQuery) {
  const municipalities = await prisma.municipality.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const municipalityId = municipalities.some((item) => item.id === query.municipalityId)
    ? query.municipalityId
    : "";

  const where: Prisma.AuditLogWhereInput = {
    ...(query.from || query.to ? {
      timestamp: {
        ...(query.from ? { gte: new Date(`${query.from}T00:00:00+08:00`) } : {}),
        ...(query.to ? { lt: new Date(new Date(`${query.to}T00:00:00+08:00`).getTime() + 86_400_000) } : {}),
      },
    } : {}),
    ...(query.category ? {
      OR: query.category === "mobile_session"
        ? [{ action: { startsWith: "MOBILE_" } }, { model: "MobileSession" }]
        : [{ action: { in: [...ACTIONS[query.category]] } }],
    } : {}),
    ...(query.target ? { model: query.target } : {}),
    ...(query.role || municipalityId ? {
      user: {
        is: {
          ...(query.role ? { role: query.role } : {}),
          ...(municipalityId ? { OR: [{ municipalityPresidentId: municipalityId }, { municipalityOfficerId: municipalityId }] } : {}),
        },
      },
    } : {}),
  };

  const total = await prisma.auditLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    skip: (page - 1) * AUDIT_PAGE_SIZE,
    take: AUDIT_PAGE_SIZE,
    select: {
      id: true,
      timestamp: true,
      action: true,
      model: true,
      user: {
        select: {
          role: true,
          municipalityAsPresident: { select: { name: true } },
          municipalityAsOfficer: { select: { name: true } },
        },
      },
    },
  });

  return {
    total,
    totalPages,
    page,
    municipalities,
    municipalityId,
    rows: logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      ...describeAuditAction(log.action, log.model),
      currentRole: log.user.role,
      currentMunicipality: log.user.municipalityAsOfficer?.name ?? log.user.municipalityAsPresident?.name ?? null,
    })),
  };
}
