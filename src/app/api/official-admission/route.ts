import { AdmissionStatus, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { registerFaceEmbedding } from "@/lib/face-ai";
import { saveAdmissionProof } from "@/lib/proof-storage";
import {
  positionToLegacyRole,
  SKOfficialAdmissionSubmissionPayload,
  SKOfficialFormPayload,
  validateSKOfficialPayload,
} from "@/lib/sk-official";

export const dynamic = "force-dynamic";


type SubmitOfficialAdmissionBody = Partial<SKOfficialAdmissionSubmissionPayload>;

const parseDate = (value: string): Date => new Date(`${value}T00:00:00`);

function normalizePayload(
  body: SubmitOfficialAdmissionBody,
  fallbackEmail: string | null | undefined,
): SKOfficialAdmissionSubmissionPayload {
  const basePayload: SKOfficialFormPayload = {
    firstName: body.firstName?.trim() ?? "",
    middleName: body.middleName?.trim() || null,
    lastName: body.lastName?.trim() ?? "",
    birthDate: body.birthDate ?? "",
    province: body.province?.trim() ?? "Oriental Mindoro",
    municipalityId: body.municipalityId?.trim() ?? "",
    barangayId: body.barangayId?.trim() ?? "",
    position: body.position ?? "SK_CHAIRPERSON",
    dateElected: body.dateElected ?? "",
    termEnd: body.termEnd ?? "",
    email: body.email?.trim() ?? fallbackEmail?.trim() ?? "",
    contactNo: body.contactNo?.trim() || null,
    address: body.address?.trim() || null,
  };

  return {
    ...basePayload,
    proofUpload: body.proofUpload ?? {
      fileName: "",
      mimeType: "",
      dataUrl: "",
    },
    faceCapture: body.faceCapture ?? {
      imageBase64: "",
      livenessFrames: [],
    },
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== Role.OFFICIAL) {
      return NextResponse.json(
        { error: "Only OFFICIAL users can submit admission details." },
        { status: 403 },
      );
    }

    let body: SubmitOfficialAdmissionBody;
    try {
      body = (await request.json()) as SubmitOfficialAdmissionBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const payload = normalizePayload(body, session.user.email ?? null);

    const validationError = validateSKOfficialPayload(payload, { requireEmail: false });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!payload.proofUpload?.dataUrl || !payload.proofUpload?.fileName) {
      return NextResponse.json(
        { error: "Proof of office upload is required." },
        { status: 400 },
      );
    }

    if (
      !payload.faceCapture?.imageBase64 ||
      !Array.isArray(payload.faceCapture.livenessFrames) ||
      payload.faceCapture.livenessFrames.length < 2
    ) {
      return NextResponse.json(
        { error: "Facial registration capture is required." },
        { status: 400 },
      );
    }

    const [municipality, barangay] = await Promise.all([
      prisma.municipality.findUnique({
        where: { id: payload.municipalityId },
        select: {
          id: true,
          name: true,
          province: true,
          municipalPresident: {
            select: { id: true },
          },
        },
      }),
      prisma.barangay.findUnique({
        where: { id: payload.barangayId },
        select: {
          id: true,
          name: true,
          municipalityId: true,
        },
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

    if (!municipality.municipalPresident) {
      return NextResponse.json(
        { error: "Selected municipality has no assigned Municipal President yet." },
        { status: 400 },
      );
    }

    const [proofFile, aiResponse] = await Promise.all([
      saveAdmissionProof(payload.proofUpload, session.user.id),
      registerFaceEmbedding({
        userId: session.user.id,
        imageBase64: payload.faceCapture.imageBase64,
        livenessFrames: payload.faceCapture.livenessFrames,
      }),
    ]);

    const now = new Date();

    const profile = await prisma.$transaction(async (tx) => {
      const savedOfficial = await tx.sKOfficial.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          firstName: payload.firstName,
          middleName: payload.middleName,
          lastName: payload.lastName,
          birthDate: parseDate(payload.birthDate),
          province: municipality.province || payload.province,
          municipalityId: municipality.id,
          municipality: municipality.name,
          barangayId: barangay.id,
          barangay: barangay.name,
          position: payload.position,
          dateElected: parseDate(payload.dateElected),
          termStart: parseDate(payload.dateElected),
          termEnd: parseDate(payload.termEnd),
          admissionStatus: AdmissionStatus.PENDING,
          rejectionReason: null,
          approvedBy: null,
          approvedAt: null,
          role: positionToLegacyRole(payload.position),
          status: OfficialStatus.INACTIVE,
          email: payload.email || session.user.email || null,
          contactNo: payload.contactNo,
          address: payload.address,
          proofDocumentUrl: proofFile.proofDocumentUrl,
          proofDocumentName: proofFile.proofDocumentName,
          proofDocumentType: proofFile.proofDocumentType,
        },
        update: {
          firstName: payload.firstName,
          middleName: payload.middleName,
          lastName: payload.lastName,
          birthDate: parseDate(payload.birthDate),
          province: municipality.province || payload.province,
          municipalityId: municipality.id,
          municipality: municipality.name,
          barangayId: barangay.id,
          barangay: barangay.name,
          position: payload.position,
          dateElected: parseDate(payload.dateElected),
          termStart: parseDate(payload.dateElected),
          termEnd: parseDate(payload.termEnd),
          admissionStatus: AdmissionStatus.PENDING,
          rejectionReason: null,
          approvedBy: null,
          approvedAt: null,
          role: positionToLegacyRole(payload.position),
          status: OfficialStatus.INACTIVE,
          email: payload.email || session.user.email || null,
          contactNo: payload.contactNo,
          address: payload.address,
          proofDocumentUrl: proofFile.proofDocumentUrl,
          proofDocumentName: proofFile.proofDocumentName,
          proofDocumentType: proofFile.proofDocumentType,
        },
        select: {
          id: true,
          userId: true,
          admissionStatus: true,
          updatedAt: true,
          proofDocumentUrl: true,
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          status: UserStatus.PENDING,
          municipalityOfficerId: municipality.id,
          faceEmbedding: aiResponse.encryptedEmbedding,
          faceRegistered: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "SUBMIT_OFFICIAL_ADMISSION_WIZARD",
          model: "SKOfficial",
          recordId: savedOfficial.id,
          userId: session.user.id,
          timestamp: now,
        },
      });

      return savedOfficial;
    });

    return NextResponse.json(
      {
        message: "Admission details submitted. Please wait for staff approval.",
        data: profile,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/official-admission error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to submit admission profile.",
      },
      { status: 500 },
    );
  }
}



