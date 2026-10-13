import {
  AdmissionStatus,
  KKProfileStatus,
  OfficialStatus,
  Prisma,
  Role,
  UserStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PENDING_KK_STATUSES = [
  KKProfileStatus.DRAFT,
  KKProfileStatus.PENDING_EMAIL_VERIFICATION,
  KKProfileStatus.PENDING_VERIFICATION,
  KKProfileStatus.NEEDS_CORRECTION,
];

function statusFilter(status: string): Prisma.UserWhereInput | undefined {
  if (status === "APPROVED") {
    return {
      OR: [
        {
          role: Role.OFFICIAL,
          OR: [
            { status: UserStatus.APPROVED },
            { official: { is: { admissionStatus: AdmissionStatus.APPROVED } } },
            { skOfficialProfile: { is: { status: AdmissionStatus.APPROVED } } },
          ],
        },
        { role: Role.KK_MEMBER, kkProfile: { is: { status: KKProfileStatus.VERIFIED } } },
      ],
    };
  }
  if (status === "PENDING") {
    return {
      OR: [
        {
          role: Role.OFFICIAL,
          OR: [
            { status: UserStatus.PENDING },
            { official: { is: { admissionStatus: AdmissionStatus.PENDING } } },
            { skOfficialProfile: { is: { status: AdmissionStatus.PENDING } } },
          ],
        },
        { role: Role.KK_MEMBER, kkProfile: { is: { status: { in: PENDING_KK_STATUSES } } } },
      ],
    };
  }
  if (status === "ACTIVE") {
    return {
      OR: [
        { role: Role.OFFICIAL, official: { is: { status: OfficialStatus.ACTIVE } } },
      ],
    };
  }
  if (status === "INCOMPLETE") {
    return {
      OR: [
        { role: Role.OFFICIAL, AND: [{ official: { is: null } }, { skOfficialProfile: { is: null } }] },
        { role: Role.KK_MEMBER, kkProfile: { is: null } },
        { role: Role.KK_MEMBER, kkProfile: { is: { status: KKProfileStatus.DRAFT } } },
      ],
    };
  }
  return undefined;
}

function accountStatus(user: {
  role: Role;
  status: UserStatus;
  official: { status: OfficialStatus; admissionStatus: AdmissionStatus } | null;
  skOfficialProfile: { status: AdmissionStatus } | null;
  kkProfile: { status: KKProfileStatus } | null;
}) {
  if (user.role === Role.KK_MEMBER) {
    const status = user.kkProfile?.status;
    if (status === KKProfileStatus.VERIFIED) return "APPROVED";
    if (status === KKProfileStatus.DRAFT) return "INCOMPLETE";
    if (status && PENDING_KK_STATUSES.includes(status as (typeof PENDING_KK_STATUSES)[number])) return "PENDING";
    if (status === KKProfileStatus.REJECTED || status === KKProfileStatus.ARCHIVED) return status;
    return user.status;
  }
  if (user.status !== UserStatus.APPROVED) return user.status;
  if (user.official?.status === OfficialStatus.ACTIVE) return "ACTIVE";
  return user.official?.admissionStatus ?? user.skOfficialProfile?.status ?? user.status;
}

export async function GET(request: Request) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, 120);
  const type = params.get("type") ?? "ALL";
  const status = params.get("status") ?? "ALL";
  const municipalityId = params.get("municipalityId") ?? "";
  const barangayId = params.get("barangayId") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = 30;
  const roles = type === "OFFICIALS"
    ? [Role.OFFICIAL]
    : type === "KK_MEMBERS"
      ? [Role.KK_MEMBER]
      : [Role.OFFICIAL, Role.KK_MEMBER];

  const and: Prisma.UserWhereInput[] = [{ role: { in: roles } }];
  if (query) {
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { kkProfile: { is: { email: { contains: query, mode: "insensitive" } } } },
        { official: { is: { OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { middleName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ] } } },
        { kkProfile: { is: { OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { middleName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ] } } },
      ],
    });
  }
  if (municipalityId) {
    and.push({
      OR: [
        { official: { is: { municipalityId } } },
        { kkProfile: { is: { municipalityId } } },
      ],
    });
  }
  if (barangayId) {
    and.push({
      OR: [
        { official: { is: { barangayId } } },
        { kkProfile: { is: { barangayId } } },
      ],
    });
  }
  const selectedStatus = statusFilter(status);
  if (selectedStatus) and.push(selectedStatus);
  const where: Prisma.UserWhereInput = { AND: and };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [totalOfficials, totalMembers, pendingOfficials, pendingKkRegistrations, recentlyUpdated, total, users, municipalities, barangays] = await Promise.all([
      prisma.user.count({ where: { role: Role.OFFICIAL } }),
      prisma.user.count({ where: { role: Role.KK_MEMBER } }),
      prisma.user.count({
        where: {
          role: Role.OFFICIAL,
          OR: [
            { status: UserStatus.PENDING },
            { official: { is: { admissionStatus: AdmissionStatus.PENDING } } },
            { skOfficialProfile: { is: { status: AdmissionStatus.PENDING } } },
          ],
        },
      }),
      prisma.kKMemberProfile.count({ where: { status: { in: PENDING_KK_STATUSES } } }),
      prisma.user.count({
        where: {
          role: { in: [Role.OFFICIAL, Role.KK_MEMBER] },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          official: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              municipality: true,
              barangay: true,
              status: true,
              admissionStatus: true,
              municipalityRef: { select: { name: true } },
              barangayRef: { select: { name: true } },
            },
          },
          skOfficialProfile: { select: { status: true, municipality: true, barangay: true } },
          kkProfile: {
            select: {
              email: true,
              firstName: true,
              middleName: true,
              lastName: true,
              status: true,
              municipality: { select: { name: true } },
              barangay: { select: { name: true } },
            },
          },
        },
      }),
      prisma.municipality.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.barangay.findMany({ select: { id: true, name: true, municipalityId: true }, orderBy: { name: "asc" } }),
    ]);

    const data = users.map((user) => {
      const official = user.official;
      const kkProfile = user.kkProfile;
      const parts = user.role === Role.KK_MEMBER
        ? [kkProfile?.firstName, kkProfile?.middleName, kkProfile?.lastName]
        : [official?.firstName, official?.middleName, official?.lastName];
      return {
        id: user.id,
        name: parts.filter(Boolean).join(" ") || user.name || "Unnamed account",
        email: user.kkProfile?.email ?? user.email,
        accountType: user.role === Role.OFFICIAL ? "SK Official" : "KK Member",
        role: user.role,
        status: accountStatus(user),
        municipality: official?.municipalityRef?.name ?? kkProfile?.municipality?.name ?? official?.municipality ?? user.skOfficialProfile?.municipality ?? "",
        barangay: official?.barangayRef?.name ?? kkProfile?.barangay?.name ?? official?.barangay ?? user.skOfficialProfile?.barangay ?? "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    return NextResponse.json({
      summary: { totalOfficials, totalMembers, pendingOfficials, pendingKkRegistrations, recentlyUpdated },
      data,
      total,
      page,
      pageSize,
      municipalities,
      barangays,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load account management records." }, { status: 500 });
  }
}
