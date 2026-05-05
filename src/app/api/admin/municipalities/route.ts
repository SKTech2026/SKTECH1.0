import { Prisma, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



type CreateMunicipalityBody = {
  name?: string;
  province?: string;
  presidentId?: string | null;
};

type UpdateMunicipalityBody = {
  id?: string;
  name?: string;
  province?: string;
  presidentId?: string | null;
};

type DeleteMunicipalityBody = {
  id?: string;
};

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.ADMIN || session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json(
        { error: "Only approved admin accounts can manage municipalities." },
        { status: 403 },
      ),
    };
  }

  return { session };
};

const mapMunicipality = (item: {
  id: string;
  name: string;
  province: string;
  createdAt: Date;
  updatedAt: Date;
  municipalPresident: {
    id: string;
    name: string | null;
    employeeId: string | null;
    status: UserStatus;
  } | null;
  _count: {
    officialRecords: number;
    admissions: number;
    barangays: number;
  };
}) => ({
  id: item.id,
  name: item.name,
  province: item.province,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  officerCount: item._count.officialRecords,
  admissionCount: item._count.admissions,
  barangayCount: item._count.barangays,
  municipalPresident: item.municipalPresident
    ? {
        id: item.municipalPresident.id,
        name: item.municipalPresident.name,
        userId: item.municipalPresident.employeeId,
        status: item.municipalPresident.status,
      }
    : null,
});

const assignMunicipalPresident = async (
  tx: Prisma.TransactionClient,
  municipalityId: string,
  presidentId: string | null,
) => {
  if (!presidentId) {
    await tx.user.updateMany({
      where: {
        role: Role.STAFF,
        municipalityPresidentId: municipalityId,
      },
      data: {
        municipalityPresidentId: null,
      },
    });
    return;
  }

  const staff = await tx.user.findUnique({
    where: { id: presidentId },
    select: { id: true, role: true, status: true },
  });

  if (!staff || staff.role !== Role.STAFF) {
    throw new Error("Selected municipal president must be a STAFF account.");
  }

  if (staff.status !== UserStatus.APPROVED) {
    throw new Error("Selected municipal president account is not approved.");
  }

  await tx.user.updateMany({
    where: {
      role: Role.STAFF,
      municipalityPresidentId: municipalityId,
      id: { not: presidentId },
    },
    data: {
      municipalityPresidentId: null,
    },
  });

  await tx.user.update({
    where: { id: presidentId },
    data: {
      municipalityPresidentId: municipalityId,
    },
  });
};

export async function GET() {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    const [municipalities, staffOptions] = await Promise.all([
      prisma.municipality.findMany({
        orderBy: [{ province: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          province: true,
          createdAt: true,
          updatedAt: true,
          municipalPresident: {
            select: {
              id: true,
              name: true,
              employeeId: true,
              status: true,
            },
          },
          _count: {
            select: {
              officialRecords: true,
              admissions: true,
              barangays: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          role: Role.STAFF,
          status: UserStatus.APPROVED,
        },
        orderBy: [{ name: "asc" }, { employeeId: "asc" }],
        select: {
          id: true,
          name: true,
          employeeId: true,
          municipalityAsPresident: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        data: municipalities.map(mapMunicipality),
        staffOptions: staffOptions.map((staff) => ({
          id: staff.id,
          name: staff.name,
          userId: staff.employeeId,
          assignedMunicipality: staff.municipalityAsPresident
            ? {
                id: staff.municipalityAsPresident.id,
                name: staff.municipalityAsPresident.name,
                province: staff.municipalityAsPresident.province,
              }
            : null,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/admin/municipalities error:", error);
    return NextResponse.json({ error: "Failed to fetch municipalities." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: CreateMunicipalityBody;
    try {
      body = (await request.json()) as CreateMunicipalityBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const name = body.name?.trim() ?? "";
    const province = body.province?.trim() ?? "";
    const presidentId = body.presidentId?.trim() || null;

    if (!name || !province) {
      return NextResponse.json({ error: "Name and province are required." }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const municipality = await tx.municipality.create({
        data: {
          name,
          province,
        },
      });

      await assignMunicipalPresident(tx, municipality.id, presidentId);
      return municipality;
    });

    return NextResponse.json(
      {
        message: "Municipality created successfully.",
        data: created,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("municipal president")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Municipality already exists or assignment conflicts with existing data." },
        { status: 409 },
      );
    }

    if (process.env.NODE_ENV !== "production") console.error("POST /api/admin/municipalities error:", error);
    return NextResponse.json({ error: "Failed to create municipality." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: UpdateMunicipalityBody;
    try {
      body = (await request.json()) as UpdateMunicipalityBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const id = body.id?.trim() ?? "";
    const name = body.name?.trim();
    const province = body.province?.trim();
    const hasPresidentUpdate = Object.prototype.hasOwnProperty.call(body, "presidentId");
    const presidentId = hasPresidentUpdate ? body.presidentId?.trim() || null : undefined;

    if (!id) {
      return NextResponse.json({ error: "Municipality ID is required." }, { status: 400 });
    }

    const existing = await prisma.municipality.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Municipality not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (name || province) {
        await tx.municipality.update({
          where: { id },
          data: {
            ...(name ? { name } : {}),
            ...(province ? { province } : {}),
          },
        });
      }

      if (hasPresidentUpdate) {
        await assignMunicipalPresident(tx, id, presidentId ?? null);
      }
    });

    return NextResponse.json({ message: "Municipality updated successfully." }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("municipal president")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Municipality update conflicts with existing records." },
        { status: 409 },
      );
    }

    if (process.env.NODE_ENV !== "production") console.error("PATCH /api/admin/municipalities error:", error);
    return NextResponse.json({ error: "Failed to update municipality." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: DeleteMunicipalityBody;
    try {
      body = (await request.json()) as DeleteMunicipalityBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const id = body.id?.trim() ?? "";
    if (!id) {
      return NextResponse.json({ error: "Municipality ID is required." }, { status: 400 });
    }

    const [staffLinked, officersLinked, admissionsLinked, officialRecordsLinked, barangaysLinked] =
      await Promise.all([
      prisma.user.count({
        where: {
          municipalityPresidentId: id,
        },
      }),
      prisma.user.count({
        where: {
          municipalityOfficerId: id,
        },
      }),
      prisma.officialAdmission.count({
        where: {
          municipalityId: id,
        },
      }),
      prisma.sKOfficial.count({
        where: {
          municipalityId: id,
        },
      }),
      prisma.barangay.count({
        where: {
          municipalityId: id,
        },
      }),
    ]);

    if (
      staffLinked > 0 ||
      officersLinked > 0 ||
      admissionsLinked > 0 ||
      officialRecordsLinked > 0 ||
      barangaysLinked > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete municipality while it has linked staff, officers, official records, admissions, or barangays.",
          linked: {
            staffLinked,
            officersLinked,
            admissionsLinked,
            officialRecordsLinked,
            barangaysLinked,
          },
        },
        { status: 409 },
      );
    }

    await prisma.municipality.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Municipality deleted successfully." }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("DELETE /api/admin/municipalities error:", error);
    return NextResponse.json({ error: "Failed to delete municipality." }, { status: 500 });
  }
}



