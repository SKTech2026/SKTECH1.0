import {
  AdmissionStatus,
  OfficialStatus,
  Role,
  UserStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";


type UpdateAdmissionBody = {
  id?: string;
  action?: "APPROVE" | "REJECT";
  reason?: string | null;
};

const requireStaffSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.STAFF) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  if (!session.user.municipalityPresidentId) {
    return {
      error: NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      ),
    };
  }

  return { session };
};

export async function GET(request: NextRequest) {
  try {
    const guard = await requireStaffSession();
    if (guard.error) {
      return guard.error;
    }

    const staffMunicipalityId = guard.session.user.municipalityPresidentId!;
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const municipalityFilter = request.nextUrl.searchParams.get("municipalityId")?.trim() ?? "";

    if (municipalityFilter && municipalityFilter !== staffMunicipalityId) {
      return NextResponse.json(
        { error: "You can only review admissions for your assigned municipality." },
        { status: 403 },
      );
    }

    const records = await prisma.sKOfficial.findMany({
      where: {
        municipalityId: staffMunicipalityId,
        admissionStatus: AdmissionStatus.PENDING,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { middleName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { barangay: { contains: q, mode: "insensitive" } },
                { municipality: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        birthDate: true,
        province: true,
        email: true,
        contactNo: true,
        address: true,
        municipalityId: true,
        municipality: true,
        barangay: true,
        position: true,
        dateElected: true,
        termEnd: true,
        proofDocumentUrl: true,
        proofDocumentName: true,
        proofDocumentType: true,
        admissionStatus: true,
        createdAt: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    const staffMunicipality = await prisma.municipality.findUnique({
      where: { id: staffMunicipalityId },
      select: {
        id: true,
        name: true,
        province: true,
      },
    });

    return NextResponse.json(
      {
        data: records,
        filters: {
          municipalities: staffMunicipality ? [staffMunicipality] : [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/staff/admissions error:", error);
    return NextResponse.json({ error: "Failed to load admissions queue." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireStaffSession();
    if (guard.error) {
      return guard.error;
    }

    const reviewerId = guard.session.user.id;
    const staffMunicipalityId = guard.session.user.municipalityPresidentId!;

    let body: UpdateAdmissionBody;
    try {
      body = (await request.json()) as UpdateAdmissionBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const id = body.id?.trim() ?? "";
    const action = body.action;
    const reason = body.reason?.trim() || null;

    if (!id || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json({ error: "id and valid action are required." }, { status: 400 });
    }

    if (action === "REJECT" && (!reason || reason.length < 3)) {
      return NextResponse.json(
        { error: "Rejection reason is required (minimum 3 characters)." },
        { status: 400 },
      );
    }

    const existing = await prisma.sKOfficial.findFirst({
      where: {
        id,
        municipalityId: staffMunicipalityId,
      },
      select: {
        id: true,
        userId: true,
        admissionStatus: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Admission record not found." }, { status: 404 });
    }

    if (existing.admissionStatus !== AdmissionStatus.PENDING) {
      return NextResponse.json(
        { error: "Only pending admissions can be reviewed." },
        { status: 409 },
      );
    }

    const now = new Date();
    const approved = action === "APPROVE";

    const updated = await prisma.$transaction(async (tx) => {
      const official = await tx.sKOfficial.update({
        where: { id: existing.id },
        data: {
          admissionStatus: approved ? AdmissionStatus.APPROVED : AdmissionStatus.REJECTED,
          status: approved ? OfficialStatus.ACTIVE : OfficialStatus.INACTIVE,
          rejectionReason: approved ? null : reason,
          approvedBy: reviewerId,
          approvedAt: now,
        },
        select: {
          id: true,
          admissionStatus: true,
          status: true,
          rejectionReason: true,
          approvedBy: true,
          approvedAt: true,
        },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            status: approved ? UserStatus.APPROVED : UserStatus.REJECTED,
            municipalityOfficerId: staffMunicipalityId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: approved ? "APPROVE_OFFICIAL_ADMISSION" : "REJECT_OFFICIAL_ADMISSION",
          model: "SKOfficial",
          recordId: existing.id,
          userId: reviewerId,
        },
      });

      return official;
    });

    return NextResponse.json(
      {
        message: approved ? "Admission approved." : "Admission rejected.",
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("PATCH /api/staff/admissions error:", error);
    return NextResponse.json({ error: "Failed to update admission." }, { status: 500 });
  }
}



