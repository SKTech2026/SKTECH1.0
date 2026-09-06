import {
  OfficialPosition,
  ProfileChangeRequestStatus,
  Role,
  SKFederationPosition,
  Sex,
  UserStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { positionToLegacyRole } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

type RequestedChanges = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  birthDate: string;
  sex: Sex;
  position: OfficialPosition;
  skFederationOfficer: boolean;
  skFederationPosition: SKFederationPosition | null;
  municipalityId: string;
  municipality: string;
  province: string;
  barangayId: string;
  barangay: string;
  sitio: string | null;
  dateElected: string;
  termEnd: string | null;
  contactNo: string | null;
  address: string | null;
};

type UpdateBody = {
  id?: string;
  action?: "APPROVE" | "REJECT";
  reason?: string | null;
};

async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (session.user.role !== Role.STAFF || session.user.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  if (!session.user.municipalityPresidentId) {
    return { error: NextResponse.json({ error: "Staff account is not assigned to a municipality." }, { status: 403 }) };
  }
  return { session, municipalityId: session.user.municipalityPresidentId };
}

export async function GET() {
  try {
    const guard = await requireStaff();
    if (guard.error) return guard.error;

    const requests = await prisma.officialProfileChangeRequest.findMany({
      where: {
        municipalityId: guard.municipalityId,
        status: ProfileChangeRequestStatus.PENDING,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        requestedChanges: true,
        currentSnapshot: true,
        requestedPhotoUrl: true,
        faceMatchScore: true,
        faceCheckStatus: true,
        rejectionReason: true,
        createdAt: true,
        official: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            municipality: true,
            barangay: true,
            municipalityId: true,
            user: { select: { image: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: requests });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET profile change requests error:", error);
    return NextResponse.json({ error: "Failed to load profile change requests." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireStaff();
    if (guard.error) return guard.error;

    let body: UpdateBody;
    try {
      body = (await request.json()) as UpdateBody;
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
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    const existing = await prisma.officialProfileChangeRequest.findFirst({
      where: {
        id,
        municipalityId: guard.municipalityId,
        status: ProfileChangeRequestStatus.PENDING,
      },
      select: {
        id: true,
        officialId: true,
        requestedByUserId: true,
        requestedPhotoUrl: true,
        requestedChanges: true,
        status: true,
        official: { select: { id: true, userId: true, municipalityId: true } },
      },
    });

    if (!existing || existing.official.municipalityId !== guard.municipalityId) {
      return NextResponse.json({ error: "Profile change request not found." }, { status: 404 });
    }
    if (existing.requestedByUserId === guard.session.user.id) {
      return NextResponse.json({ error: "You cannot review your own profile change." }, { status: 403 });
    }

    const now = new Date();
    const changes = existing.requestedChanges as unknown as RequestedChanges;
    if (action === "APPROVE" && changes.municipalityId !== guard.municipalityId) {
      return NextResponse.json(
        { error: "This request targets a different municipality and cannot be approved here." },
        { status: 403 },
      );
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (action === "REJECT") {
        return tx.officialProfileChangeRequest.update({
          where: { id: existing.id },
          data: {
            status: ProfileChangeRequestStatus.REJECTED,
            rejectionReason: reason,
            staffReviewerId: guard.session.user.id,
            reviewedAt: now,
          },
          select: { id: true, status: true, rejectionReason: true, reviewedAt: true },
        });
      }

      await tx.sKOfficial.update({
        where: { id: existing.officialId },
        data: {
          firstName: changes.firstName,
          middleName: changes.middleName,
          lastName: changes.lastName,
          suffix: changes.suffix,
          birthDate: new Date(changes.birthDate),
          sex: changes.sex,
          province: changes.province,
          municipalityId: changes.municipalityId,
          municipality: changes.municipality,
          barangayId: changes.barangayId,
          barangay: changes.barangay,
          sitio: changes.sitio,
          position: changes.position,
          role: positionToLegacyRole(changes.position),
          skFederationOfficer: changes.skFederationOfficer,
          skFederationPosition: changes.skFederationPosition,
          dateElected: new Date(changes.dateElected),
          termStart: new Date(changes.dateElected),
          termEnd: changes.termEnd ? new Date(changes.termEnd) : null,
          contactNo: changes.contactNo,
          address: changes.address,
        },
      });

      if (existing.official.userId && existing.requestedPhotoUrl) {
        await tx.user.update({
          where: { id: existing.official.userId },
          data: { image: existing.requestedPhotoUrl },
        });
      }

      return tx.officialProfileChangeRequest.update({
        where: { id: existing.id },
        data: {
          status: ProfileChangeRequestStatus.APPROVED,
          staffReviewerId: guard.session.user.id,
          reviewedAt: now,
          rejectionReason: null,
        },
        select: { id: true, status: true, reviewedAt: true },
      });
    });

    await prisma.auditLog.create({
      data: {
        action: action === "APPROVE" ? "APPROVE_OFFICIAL_PROFILE_CHANGE" : "REJECT_OFFICIAL_PROFILE_CHANGE",
        model: "OfficialProfileChangeRequest",
        recordId: existing.id,
        userId: guard.session.user.id,
      },
    });

    return NextResponse.json({ message: action === "APPROVE" ? "Profile change approved." : "Profile change rejected.", data: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("PATCH profile change request error:", error);
    return NextResponse.json({ error: "Failed to review profile change request." }, { status: 500 });
  }
}
