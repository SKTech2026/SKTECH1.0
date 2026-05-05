import { Prisma, Role, UserStatus } from "@prisma/client";
import { hash as hashPassword } from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



const POSITION_PREFIX = "staff-position:";
const MIN_PASSWORD_LENGTH = 8;

type CreateStaffAdmissionBody = {
  name?: string;
  position?: string;
  userId?: string;
  password?: string;
  municipalityId?: string;
};

type UpdateStaffAdmissionBody = {
  id?: string;
  name?: string;
  position?: string;
  userId?: string;
  password?: string;
  municipalityId?: string;
};

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.ADMIN || session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json(
        { error: "Only approved admin accounts can manage staff admission." },
        { status: 403 },
      ),
    };
  }

  return { session };
};

const encodePosition = (position: string) => `${POSITION_PREFIX}${position.trim()}`;

const decodePosition = (rawImage: string | null) => {
  if (!rawImage) {
    return "";
  }

  if (rawImage.startsWith(POSITION_PREFIX)) {
    return rawImage.slice(POSITION_PREFIX.length);
  }

  return "";
};

const resolveMunicipality = async (municipalityId: string) => {
  return prisma.municipality.findUnique({
    where: { id: municipalityId },
    select: { id: true, name: true, province: true },
  });
};

const mapStaffRecord = (
  record: {
    id: string;
    name: string | null;
    employeeId: string | null;
    status: UserStatus;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    municipalityAsPresident: {
      id: string;
      name: string;
      province: string;
    } | null;
  },
) => ({
  id: record.id,
  name: record.name ?? "",
  position: decodePosition(record.image),
  userId: record.employeeId ?? "",
  municipalityId: record.municipalityAsPresident?.id ?? null,
  municipalityName: record.municipalityAsPresident?.name ?? null,
  municipalityProvince: record.municipalityAsPresident?.province ?? null,
  status: record.status,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const clearMunicipalityPresident = async (
  tx: Prisma.TransactionClient,
  municipalityId: string,
  excludedStaffId?: string,
) => {
  await tx.user.updateMany({
    where: {
      role: Role.STAFF,
      municipalityPresidentId: municipalityId,
      ...(excludedStaffId ? { id: { not: excludedStaffId } } : {}),
    },
    data: {
      municipalityPresidentId: null,
    },
  });
};

export async function GET() {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    const [staffUsers, municipalities] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: Role.STAFF,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          status: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          municipalityAsPresident: {
            select: {
              id: true,
              name: true,
              province: true,
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
          municipalPresident: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        data: staffUsers.map(mapStaffRecord),
        municipalities: municipalities.map((item) => ({
          id: item.id,
          name: item.name,
          province: item.province,
          assignedPresident: item.municipalPresident
            ? {
                id: item.municipalPresident.id,
                name: item.municipalPresident.name,
                userId: item.municipalPresident.employeeId,
              }
            : null,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/staff-admission error:", error);
    return NextResponse.json({ error: "Failed to fetch staff records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: CreateStaffAdmissionBody;
    try {
      body = (await request.json()) as CreateStaffAdmissionBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const name = body.name?.trim() ?? "";
    const position = body.position?.trim() ?? "";
    const userId = body.userId?.trim() ?? "";
    const password = body.password ?? "";
    const municipalityId = body.municipalityId?.trim() ?? "";

    if (!name || !position || !userId || !password || !municipalityId) {
      return NextResponse.json(
        { error: "Name, position, municipality, user ID, and password are required." },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const [existing, municipality] = await Promise.all([
      prisma.user.findUnique({
        where: { employeeId: userId },
        select: { id: true },
      }),
      resolveMunicipality(municipalityId),
    ]);

    if (!municipality) {
      return NextResponse.json({ error: "Selected municipality does not exist." }, { status: 404 });
    }

    if (existing) {
      return NextResponse.json({ error: "User ID already exists." }, { status: 409 });
    }

    const created = await prisma.$transaction(async (tx) => {
      await clearMunicipalityPresident(tx, municipalityId);

      return tx.user.create({
        data: {
          name,
          employeeId: userId,
          password: await hashPassword(password, 10),
          role: Role.STAFF,
          status: UserStatus.APPROVED,
          image: encodePosition(position),
          municipalityPresidentId: municipalityId,
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          status: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          municipalityAsPresident: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: `Staff account created and assigned to ${municipality.name}.`,
        data: mapStaffRecord(created),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate value conflict while creating staff account." },
        { status: 409 },
      );
    }

    if (process.env.NODE_ENV !== "production") console.error("POST /api/staff-admission error:", error);
    return NextResponse.json({ error: "Failed to create staff account." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: UpdateStaffAdmissionBody;
    try {
      body = (await request.json()) as UpdateStaffAdmissionBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const id = body.id?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const position = body.position?.trim() ?? "";
    const userId = body.userId?.trim() ?? "";
    const password = body.password ?? "";
    const municipalityId = body.municipalityId?.trim() ?? "";

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    if (!name || !position || !userId || !municipalityId) {
      return NextResponse.json(
        { error: "Name, position, municipality, and user ID are required." },
        { status: 400 },
      );
    }

    if (password && password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const [existing, municipality, duplicate] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
      }),
      resolveMunicipality(municipalityId),
      prisma.user.findFirst({
        where: {
          employeeId: userId,
          NOT: {
            id,
          },
        },
        select: { id: true },
      }),
    ]);

    if (!existing) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    if (existing.role !== Role.STAFF) {
      return NextResponse.json(
        { error: "This endpoint only supports STAFF accounts." },
        { status: 400 },
      );
    }

    if (!municipality) {
      return NextResponse.json({ error: "Selected municipality does not exist." }, { status: 404 });
    }

    if (duplicate) {
      return NextResponse.json({ error: "User ID already exists." }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await clearMunicipalityPresident(tx, municipalityId, id);

      return tx.user.update({
        where: { id },
        data: {
          name,
          employeeId: userId,
          image: encodePosition(position),
          municipalityPresidentId: municipalityId,
          ...(password ? { password: await hashPassword(password, 10) } : {}),
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          status: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          municipalityAsPresident: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: `Staff profile updated and assigned to ${municipality.name}.`,
        data: mapStaffRecord(updated),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate value conflict while updating staff profile." },
        { status: 409 },
      );
    }

    if (process.env.NODE_ENV !== "production") console.error("PATCH /api/staff-admission error:", error);
    return NextResponse.json({ error: "Failed to update staff profile." }, { status: 500 });
  }
}



