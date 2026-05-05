import { AdmissionStatus, OfficialStatus, Prisma, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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


type SubmissionMode = "ACCOUNT" | "WALK_IN";

type CreateOfficialBody = Partial<SKOfficialAdmissionSubmissionPayload> & {
  submissionMode?: SubmissionMode;
};

const parseDate = (value: string): Date => new Date(`${value}T00:00:00`);

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

const normalizePayload = (
  body: CreateOfficialBody,
  fallbackEmail: string | null | undefined,
): SKOfficialAdmissionSubmissionPayload => {
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
};

const parseSubmissionMode = (value: unknown): SubmissionMode => {
  if (value === "ACCOUNT") return "ACCOUNT";
  return "WALK_IN";
};

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
    }

    const currentSession = guard.session;
    const staffMunicipalityId =
      currentSession.user.role === Role.STAFF
        ? (currentSession.user.municipalityPresidentId ?? null)
        : null;

    if (currentSession.user.role === Role.STAFF && !staffMunicipalityId) {
      return NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      );
    }

    const params = request.nextUrl.searchParams;
    const q = params.get("q")?.trim() ?? "";
    const admissionStatus = params.get("admissionStatus");
    const municipalityIdParam = params.get("municipalityId")?.trim();
    const take = Math.min(Math.max(parseInt(params.get("take") || "20", 10), 1), 100);
    const skip = Math.max(parseInt(params.get("skip") || "0", 10), 0);

    if (
      admissionStatus &&
      !Object.values(AdmissionStatus).includes(admissionStatus as AdmissionStatus)
    ) {
      return NextResponse.json({ error: "Invalid admission status filter." }, { status: 400 });
    }

    if (
      currentSession.user.role === Role.STAFF &&
      municipalityIdParam &&
      municipalityIdParam !== staffMunicipalityId
    ) {
      return NextResponse.json(
        { error: "You can only view officials in your assigned municipality." },
        { status: 403 },
      );
    }

    const scopedMunicipalityId = staffMunicipalityId ?? municipalityIdParam ?? null;
    const andFilters: Prisma.SKOfficialWhereInput[] = [];

    if (q) {
      andFilters.push({
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { middleName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { municipality: { contains: q, mode: "insensitive" } },
          { barangay: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (admissionStatus) {
      andFilters.push({ admissionStatus: admissionStatus as AdmissionStatus });
    }

    if (scopedMunicipalityId) {
      andFilters.push({ municipalityId: scopedMunicipalityId });
    }

    const where: Prisma.SKOfficialWhereInput =
      andFilters.length > 0
        ? {
            AND: andFilters,
          }
        : {};

    const municipalityWhere = scopedMunicipalityId ? { id: scopedMunicipalityId } : {};

    const [officials, total, municipalities] = await Promise.all([
      prisma.sKOfficial.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.sKOfficial.count({ where }),
      prisma.municipality.findMany({
        where: municipalityWhere,
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
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        data: officials,
        municipalities,
        pagination: {
          total,
          take,
          skip,
          pages: Math.ceil(total / take),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/officials error:", error);
    return NextResponse.json({ error: "Failed to fetch officials." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
    }

    const currentSession = guard.session;
    const staffMunicipalityId =
      currentSession.user.role === Role.STAFF
        ? (currentSession.user.municipalityPresidentId ?? null)
        : null;

    if (currentSession.user.role === Role.STAFF && !staffMunicipalityId) {
      return NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      );
    }

    let body: CreateOfficialBody;
    try {
      body = (await request.json()) as CreateOfficialBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const submissionMode = parseSubmissionMode(body.submissionMode);
    const payload = normalizePayload(body, null);

    const requireEmail = submissionMode === "ACCOUNT";
    const validationError = validateSKOfficialPayload(payload, { requireEmail });
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

    if (staffMunicipalityId && municipality.id !== staffMunicipalityId) {
      return NextResponse.json(
        { error: "You can only create records for your assigned municipality." },
        { status: 403 },
      );
    }

    const normalizedEmail = payload.email.trim().toLowerCase();

    const linkedUser = await prisma.$transaction(async (tx) => {
      if (submissionMode === "ACCOUNT" && !normalizedEmail) {
        throw new Error("Email is required for account-based admission.");
      }

      const candidate = normalizedEmail
        ? await tx.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              role: true,
            },
          })
        : null;

      if (candidate && candidate.role !== Role.OFFICIAL) {
        throw new Error("Email is already assigned to a non-official account.");
      }

      if (candidate) {
        return tx.user.update({
          where: { id: candidate.id },
          data: {
            name: `${payload.firstName} ${payload.lastName}`.trim(),
            role: Role.OFFICIAL,
            status: UserStatus.APPROVED,
            municipalityOfficerId: municipality.id,
          },
          select: { id: true },
        });
      }

      return tx.user.create({
        data: {
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          email: normalizedEmail || null,
          role: Role.OFFICIAL,
          status: UserStatus.APPROVED,
          municipalityOfficerId: municipality.id,
        },
        select: { id: true },
      });
    });

    const [proofFile, aiResponse] = await Promise.all([
      saveAdmissionProof(payload.proofUpload, linkedUser.id),
      registerFaceEmbedding({
        userId: linkedUser.id,
        imageBase64: payload.faceCapture.imageBase64,
        livenessFrames: payload.faceCapture.livenessFrames,
      }),
    ]);

    const now = new Date();

    const created = await prisma.$transaction(async (tx) => {
      const official = await tx.sKOfficial.upsert({
        where: { userId: linkedUser.id },
        create: {
          userId: linkedUser.id,
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
          admissionStatus: AdmissionStatus.APPROVED,
          rejectionReason: null,
          approvedBy: currentSession.user.id,
          approvedAt: now,
          role: positionToLegacyRole(payload.position),
          status: OfficialStatus.ACTIVE,
          email: normalizedEmail || null,
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
          admissionStatus: AdmissionStatus.APPROVED,
          rejectionReason: null,
          approvedBy: currentSession.user.id,
          approvedAt: now,
          role: positionToLegacyRole(payload.position),
          status: OfficialStatus.ACTIVE,
          email: normalizedEmail || null,
          contactNo: payload.contactNo,
          address: payload.address,
          proofDocumentUrl: proofFile.proofDocumentUrl,
          proofDocumentName: proofFile.proofDocumentName,
          proofDocumentType: proofFile.proofDocumentType,
        },
      });

      await tx.user.update({
        where: { id: linkedUser.id },
        data: {
          status: UserStatus.APPROVED,
          municipalityOfficerId: municipality.id,
          faceEmbedding: aiResponse.encryptedEmbedding,
          faceRegistered: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action:
            submissionMode === "WALK_IN"
              ? "CREATE_WALKIN_OFFICIAL_PROFILE"
              : "CREATE_ACCOUNT_OFFICIAL_PROFILE",
          model: "SKOfficial",
          recordId: official.id,
          userId: currentSession.user.id,
        },
      });

      return official;
    });

    return NextResponse.json(
      {
        message:
          submissionMode === "WALK_IN"
            ? "Walk-in official admission saved and activated."
            : "Official account admission saved and activated.",
        data: created,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") console.error("POST /api/officials error:", error);
    return NextResponse.json({ error: "Failed to create official." }, { status: 500 });
  }
}



