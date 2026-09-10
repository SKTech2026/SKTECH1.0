import { OfficialStatus, Role, UserStatus, type Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ArchiveType = "all" | "officials" | "staff";

type ArchiveRecord = {
  id: string;
  type: "official" | "staff";
  name: string;
  email: string | null;
  position: string | null;
  role: string | null;
  municipalityId: string | null;
  municipalityName: string | null;
  barangayId: string | null;
  barangayName: string | null;
  admissionStatus: string | null;
  officialStatus: string | null;
  userStatus: string | null;
  status: string;
  terminatedAt: string | null;
  terminatedById: string | null;
  terminationReason: string | null;
};

const parseArchiveType = (value: string | null): ArchiveType =>
  value === "officials" || value === "staff" || value === "all" ? value : "all";

const parsePositiveInt = (value: string | null, fallback: number, max?: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};

const normalizeText = (value: string | null | undefined) => value?.toLowerCase().trim() ?? "";

const matchesSearch = (record: ArchiveRecord, search: string) => {
  if (!search) return true;
  const haystack = [
    record.name,
    record.email,
    record.position,
    record.role,
    record.municipalityName,
    record.barangayName,
    record.admissionStatus,
    record.status,
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(search);
};

const getAdminGuard = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.ADMIN || session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json(
        { error: "Only approved admin accounts can view the archive bin." },
        { status: 403 },
      ),
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (!currentUser || currentUser.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  return { session };
};

export async function GET(request: Request) {
  try {
    const guard = await getAdminGuard();
    if (guard.error) {
      return guard.error;
    }

    const { searchParams } = new URL(request.url);
    const archiveType = parseArchiveType(searchParams.get("type"));
    const municipalityId = searchParams.get("municipalityId")?.trim() || null;
    const barangayId = searchParams.get("barangayId")?.trim() || null;
    const search = normalizeText(searchParams.get("search"));
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 10, 50);

    const officialWhere: Prisma.SKOfficialWhereInput = {
      status: OfficialStatus.TERMINATED,
      OR: [{ userId: null }, { user: { is: { status: UserStatus.TERMINATED } } }],
      ...(municipalityId ? { municipalityId } : {}),
      ...(barangayId ? { barangayId } : {}),
    };

    const staffWhere: Prisma.UserWhereInput = {
      role: Role.STAFF,
      status: UserStatus.TERMINATED,
      ...(municipalityId ? { municipalityPresidentId: municipalityId } : {}),
    };

    const [officials, staff, municipalities] = await Promise.all([
      archiveType === "staff"
        ? Promise.resolve([])
        : prisma.sKOfficial.findMany({
            where: officialWhere,
            orderBy: [{ user: { terminatedAt: "desc" } }, { updatedAt: "desc" }],
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
              position: true,
              role: true,
              municipalityId: true,
              municipality: true,
              barangayId: true,
              barangay: true,
              admissionStatus: true,
              status: true,
              user: {
                select: {
                  email: true,
                  status: true,
                  terminatedAt: true,
                  terminatedById: true,
                  terminationReason: true,
                },
              },
            },
          }),
      archiveType === "officials"
        ? Promise.resolve([])
        : prisma.user.findMany({
            where: staffWhere,
            orderBy: [{ terminatedAt: "desc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              terminatedAt: true,
              terminatedById: true,
              terminationReason: true,
              municipalityPresidentId: true,
              municipalityAsPresident: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
      prisma.municipality.findMany({
        orderBy: [{ province: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          province: true,
          barangays: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              municipalityId: true,
            },
          },
        },
      }),
    ]);

    const officialRecords: ArchiveRecord[] = officials.map((official) => {
      const name = [official.firstName, official.middleName, official.lastName, official.suffix]
        .filter(Boolean)
        .join(" ");

      return {
        id: official.id,
        type: "official",
        name,
        email: official.user?.email ?? official.email ?? null,
        position: official.position,
        role: official.role,
        municipalityId: official.municipalityId,
        municipalityName: official.municipality,
        barangayId: official.barangayId,
        barangayName: official.barangay,
        admissionStatus: official.admissionStatus,
        officialStatus: official.status,
        userStatus: official.user?.status ?? null,
        status: official.status,
        terminatedAt: official.user?.terminatedAt?.toISOString() ?? null,
        terminatedById: official.user?.terminatedById ?? null,
        terminationReason: official.user?.terminationReason ?? null,
      };
    });

    const staffRecords: ArchiveRecord[] = staff.map((staffMember) => ({
      id: staffMember.id,
      type: "staff",
      name: staffMember.name ?? "Unnamed Staff",
      email: staffMember.email,
      position: null,
      role: staffMember.role,
      municipalityId: staffMember.municipalityPresidentId,
      municipalityName: staffMember.municipalityAsPresident?.name ?? null,
      barangayId: null,
      barangayName: null,
      admissionStatus: null,
      officialStatus: null,
      userStatus: staffMember.status,
      status: staffMember.status,
      terminatedAt: staffMember.terminatedAt?.toISOString() ?? null,
      terminatedById: staffMember.terminatedById,
      terminationReason: staffMember.terminationReason,
    }));

    const searchedOfficialRecords = officialRecords.filter((record) => matchesSearch(record, search));
    const searchedStaffRecords = staffRecords.filter((record) => matchesSearch(record, search));
    const records = [...searchedOfficialRecords, ...searchedStaffRecords].sort((a, b) => {
      const aTime = a.terminatedAt ? new Date(a.terminatedAt).getTime() : 0;
      const bTime = b.terminatedAt ? new Date(b.terminatedAt).getTime() : 0;
      return bTime - aTime || a.name.localeCompare(b.name);
    });
    const total = records.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    const filteredBarangays = municipalities
      .flatMap((municipality) => municipality.barangays)
      .filter((barangay) => !municipalityId || barangay.municipalityId === municipalityId);

    return NextResponse.json(
      {
        records: records.slice(start, start + pageSize),
        municipalities,
        barangays: filteredBarangays,
        pagination: {
          page: safePage,
          pageSize,
          total,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPreviousPage: safePage > 1,
        },
        summary: {
          total,
          officials: searchedOfficialRecords.length,
          staff: searchedStaffRecords.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/admin/archive error:", error);
    return NextResponse.json({ error: "Failed to fetch archive records." }, { status: 500 });
  }
}
