import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  OfficialRole,
  OfficialPosition,
  OfficialStatus,
  Prisma,
  Role,
  SKFederationPosition,
  Sex,
  UserStatus,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatOfficialFullName, positionToLegacyRole } from "@/lib/sk-official";

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
    if (guard.session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Only admins can manage official records." }, { status: 403 });
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
      suffix,
      birthDate,
      sex,
      role,
      status,
      position,
      municipalityId,
      barangayId,
      sitio,
      skFederationOfficer,
      skFederationPosition,
      dateElected,
      termStart,
      termEnd,
      email,
      contactNo,
      address,
    } = body;

    const updateData: Prisma.SKOfficialUncheckedUpdateInput = {};

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

    if (suffix !== undefined) {
      updateData.suffix = suffix?.trim() || null;
    }

    if (birthDate !== undefined) {
      const birthDateValue = new Date(`${birthDate}T00:00:00`);
      if (Number.isNaN(birthDateValue.getTime())) {
        return NextResponse.json({ error: "birthDate must be a valid date" }, { status: 400 });
      }
      updateData.birthDate = birthDateValue;
    }

    if (sex !== undefined) {
      if (!Object.values(Sex).includes(sex as Sex)) {
        return NextResponse.json(
          { error: `sex must be one of: ${Object.values(Sex).join(", ")}` },
          { status: 400 },
        );
      }
      updateData.sex = sex as Sex;
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

    if (position !== undefined) {
      if (!Object.values(OfficialPosition).includes(position as OfficialPosition)) {
        return NextResponse.json(
          { error: `position must be one of: ${Object.values(OfficialPosition).join(", ")}` },
          { status: 400 },
        );
      }
      updateData.position = position as OfficialPosition;
      updateData.role = positionToLegacyRole(position as OfficialPosition);
    }

    if (municipalityId !== undefined || barangayId !== undefined) {
      const nextMunicipalityId = municipalityId ?? existing.municipalityId;
      const nextBarangayId = barangayId ?? existing.barangayId;

      if (!nextMunicipalityId || !nextBarangayId) {
        return NextResponse.json(
          { error: "municipalityId and barangayId are required" },
          { status: 400 },
        );
      }

      const [municipality, barangay] = await Promise.all([
        prisma.municipality.findUnique({
          where: { id: nextMunicipalityId },
          select: { id: true, name: true, province: true },
        }),
        prisma.barangay.findUnique({
          where: { id: nextBarangayId },
          select: { id: true, name: true, municipalityId: true },
        }),
      ]);

      if (!municipality) {
        return NextResponse.json({ error: "Selected municipality was not found." }, { status: 404 });
      }
      if (!barangay || barangay.municipalityId !== municipality.id) {
        return NextResponse.json(
          { error: "Selected barangay does not belong to selected municipality." },
          { status: 400 },
        );
      }

      updateData.province = municipality.province || existing.province || "Oriental Mindoro";
      updateData.municipalityId = municipality.id;
      updateData.municipality = municipality.name;
      updateData.barangayId = barangay.id;
      updateData.barangay = barangay.name;
    }

    if (sitio !== undefined) {
      updateData.sitio = sitio?.trim() || null;
    }

    if (skFederationOfficer !== undefined) {
      updateData.skFederationOfficer = skFederationOfficer === true;
      if (skFederationOfficer !== true) {
        updateData.skFederationPosition = null;
      }
    }

    if (skFederationPosition !== undefined) {
      if (skFederationPosition === null || skFederationPosition === "") {
        updateData.skFederationPosition = null;
      } else if (
        !Object.values(SKFederationPosition).includes(
          skFederationPosition as SKFederationPosition,
        )
      ) {
        return NextResponse.json(
          {
            error: `skFederationPosition must be one of: ${Object.values(SKFederationPosition).join(", ")}`,
          },
          { status: 400 },
        );
      } else {
        updateData.skFederationPosition = skFederationPosition as SKFederationPosition;
      }
    }

    if (dateElected !== undefined) {
      const dateElectedValue = new Date(`${dateElected}T00:00:00`);
      if (Number.isNaN(dateElectedValue.getTime())) {
        return NextResponse.json({ error: "dateElected must be a valid date" }, { status: 400 });
      }
      updateData.dateElected = dateElectedValue;
      updateData.termStart = dateElectedValue;
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
      const termStartDate = new Date(`${termStart}T00:00:00`);
      if (Number.isNaN(termStartDate.getTime())) {
        return NextResponse.json({ error: "termStart must be a valid date" }, { status: 400 });
      }
      updateData.termStart = termStartDate;
    }

    if (termEnd !== undefined) {
      if (termEnd === null) {
        updateData.termEnd = null;
      } else {
        const termEndDate = new Date(`${termEnd}T00:00:00`);
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

    const official = await prisma.$transaction(async (tx) => {
      const updated = await tx.sKOfficial.update({
        where: { id },
        data: updateData,
      });

      if (updated.userId) {
        await tx.user.update({
          where: { id: updated.userId },
          data: {
            name: formatOfficialFullName(updated),
            ...(status !== undefined
              ? {
                  status:
                    updated.status === OfficialStatus.ACTIVE
                      ? UserStatus.APPROVED
                      : UserStatus.INACTIVE,
                }
              : {}),
            ...(municipalityId !== undefined
              ? { municipalityOfficerId: updated.municipalityId }
              : {}),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: status !== undefined ? `SET_OFFICIAL_${updated.status}` : "UPDATE_OFFICIAL_PROFILE",
          model: "SKOfficial",
          recordId: updated.id,
          userId: guard.session.user.id,
        },
      });

      return updated;
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
    if (guard.session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Only admins can manage official records." }, { status: 403 });
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await resolveScopedOfficial(id, guard.session);
    if (!existing) {
      return NextResponse.json({ error: "Official not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          "Hard delete is disabled because official records may be tied to attendance and history. Use deactivate instead.",
      },
      { status: 409 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("not assigned")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (process.env.NODE_ENV !== "production") console.error("DELETE /api/officials/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete official" }, { status: 500 });
  }
}



