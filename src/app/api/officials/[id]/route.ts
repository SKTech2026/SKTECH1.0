import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  OfficialRole,
  OfficialStatus,
  Prisma,
  Role,
  UserStatus,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";


type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const requireAdminOrStaff = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { session };
};

type ScopedSession = {
  user: {
    role: Role;
    municipalityPresidentId?: string | null;
  };
};

const resolveScopedOfficial = async (
  id: string,
  session: ScopedSession,
) => {
  if (session.user.role === Role.ADMIN) {
    return prisma.sKOfficial.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            municipalityOfficerId: true,
          },
        },
      },
    });
  }

  const staffMunicipalityId = session.user.municipalityPresidentId;
  if (!staffMunicipalityId) {
    throw new Error("Staff account is not assigned to a municipality.");
  }

  return prisma.sKOfficial.findFirst({
    where: {
      id,
      municipalityId: staffMunicipalityId,
    },
    include: {
      user: {
        select: {
          municipalityOfficerId: true,
        },
      },
    },
  });
};

// GET /api/officials/[id] - Get official by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const official = await resolveScopedOfficial(id, guard.session);
    if (!official) {
      return NextResponse.json({ error: "Official not found" }, { status: 404 });
    }

    return NextResponse.json(official, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not assigned")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (process.env.NODE_ENV !== "production") console.error("GET /api/officials/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch official" }, { status: 500 });
  }
}

// PUT /api/officials/[id] - Update official by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await resolveScopedOfficial(id, guard.session);
    if (!existing) {
      return NextResponse.json({ error: "Official not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      middleName,
      role,
      status,
      termStart,
      termEnd,
      email,
      contactNo,
      address,
    } = body;

    const updateData: Prisma.SKOfficialUpdateInput = {};

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return NextResponse.json(
          { error: "firstName must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || !lastName.trim()) {
        return NextResponse.json(
          { error: "lastName must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.lastName = lastName.trim();
    }

    if (middleName !== undefined) {
      updateData.middleName = middleName?.trim() || null;
    }

    if (role !== undefined) {
      if (!Object.values(OfficialRole).includes(role as OfficialRole)) {
        return NextResponse.json(
          {
            error: `role must be one of: ${Object.values(OfficialRole).join(", ")}`,
          },
          { status: 400 },
        );
      }
      updateData.role = role as OfficialRole;
    }

    if (status !== undefined) {
      if (!Object.values(OfficialStatus).includes(status as OfficialStatus)) {
        return NextResponse.json(
          {
            error: `status must be one of: ${Object.values(OfficialStatus).join(", ")}`,
          },
          { status: 400 },
        );
      }
      updateData.status = status as OfficialStatus;
    }

    if (termStart !== undefined) {
      const termStartDate = new Date(termStart);
      if (Number.isNaN(termStartDate.getTime())) {
        return NextResponse.json({ error: "termStart must be a valid date" }, { status: 400 });
      }
      updateData.termStart = termStartDate;
    }

    if (termEnd !== undefined) {
      if (termEnd === null) {
        updateData.termEnd = null;
      } else {
        const termEndDate = new Date(termEnd);
        if (Number.isNaN(termEndDate.getTime())) {
          return NextResponse.json({ error: "termEnd must be a valid date" }, { status: 400 });
        }
        updateData.termEnd = termEndDate;
      }
    }

    if (email !== undefined) {
      updateData.email = email?.trim() || null;
    }

    if (contactNo !== undefined) {
      updateData.contactNo = contactNo?.trim() || null;
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existing, { status: 200 });
    }

    const official = await prisma.sKOfficial.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(official, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not assigned")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (process.env.NODE_ENV !== "production") console.error("PUT /api/officials/[id] error:", error);
    return NextResponse.json({ error: "Failed to update official" }, { status: 500 });
  }
}

// DELETE /api/officials/[id] - Delete official by ID
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await resolveScopedOfficial(id, guard.session);
    if (!existing) {
      return NextResponse.json({ error: "Official not found" }, { status: 404 });
    }

    await prisma.sKOfficial.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Official deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not assigned")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (process.env.NODE_ENV !== "production") console.error("DELETE /api/officials/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete official" }, { status: 500 });
  }
}



