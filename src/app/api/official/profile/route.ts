import { OfficialPosition, Role, SKFederationLevel, SKFederationPosition, Sex, ProfileChangeRequestStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inspectIdPhoto, type InspectIdPhotoResult } from "@/lib/face-ai";
import {
  getSafePhotoErrorMessage,
  MAX_OFFICIAL_PHOTO_BYTES,
  OFFICIAL_PHOTO_MIME_TYPES,
  saveOfficialProfilePhoto,
} from "@/lib/official-photo-storage";

export const dynamic = "force-dynamic";

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

function parsePosition(value: string): OfficialPosition | null {
  if (Object.values(OfficialPosition).includes(value as OfficialPosition)) {
    return value as OfficialPosition;
  }
  return null;
}

function parseSex(value: string): Sex | null {
  if (Object.values(Sex).includes(value as Sex)) {
    return value as Sex;
  }
  return null;
}

function parseSKFedPosition(value: string): SKFederationPosition | null {
  if (Object.values(SKFederationPosition).includes(value as SKFederationPosition)) {
    return value as SKFederationPosition;
  }
  return null;
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== Role.OFFICIAL) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await request.formData();

    const firstName = String(formData.get("firstName") ?? "").trim();
    const middleNameRaw = String(formData.get("middleName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const suffixRaw = String(formData.get("suffix") ?? "").trim();
    const birthDate = String(formData.get("birthDate") ?? "").trim();
    const sexValue = String(formData.get("sex") ?? "").trim();
    const dateElected = String(formData.get("dateElected") ?? "").trim();
    const termEndRaw = String(formData.get("termEnd") ?? "").trim();
    const municipalityId = String(formData.get("municipalityId") ?? "").trim();
    const barangayId = String(formData.get("barangayId") ?? "").trim();
    const sitioRaw = String(formData.get("sitio") ?? "").trim();
    const positionValue = String(formData.get("position") ?? "").trim();
    const skFederationOfficer = String(formData.get("skFederationOfficer") ?? "") === "true";
    const skFederationLevelValue = String(formData.get("skFederationLevel") ?? "").trim();
    const skFederationPositionValue = String(
      formData.get("skFederationPosition") ?? "",
    ).trim();
    const contactNoRaw = String(formData.get("contactNo") ?? "").trim();
    const addressRaw = String(formData.get("address") ?? "").trim();
    const photo = formData.get("photo");
    console.info("[PHOTO] profile save received");

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 },
      );
    }
    if (!municipalityId || !barangayId) {
      return NextResponse.json(
        { error: "Municipality and barangay are required." },
        { status: 400 },
      );
    }
    if (!dateElected) {
      return NextResponse.json({ error: "Date elected is required." }, { status: 400 });
    }
    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required." }, { status: 400 });
    }

    const sex = parseSex(sexValue);
    if (!sex) {
      return NextResponse.json({ error: "Sex is required." }, { status: 400 });
    }

    const position = parsePosition(positionValue);
    if (!position) {
      return NextResponse.json({ error: "Invalid position." }, { status: 400 });
    }

    const skFederationPosition = skFederationOfficer
      ? parseSKFedPosition(skFederationPositionValue)
      : null;
    const skFederationLevel = skFederationOfficer
      ? (Object.values(SKFederationLevel).includes(skFederationLevelValue as SKFederationLevel) ? skFederationLevelValue as SKFederationLevel : null)
      : null;
    if ((skFederationOfficer && !skFederationLevel) || (!skFederationOfficer && (skFederationLevelValue || skFederationPositionValue))) {
      return NextResponse.json({ error: "Invalid federation category." }, { status: 400 });
    }
    if (skFederationOfficer && !skFederationPosition) {
      return NextResponse.json(
        { error: "SKFED position is required for SK Federation Officers." },
        { status: 400 },
      );
    }

    const parsedBirthDate = parseDate(birthDate);
    if (Number.isNaN(parsedBirthDate.getTime())) {
      return NextResponse.json({ error: "Invalid birth date." }, { status: 400 });
    }

    const parsedDateElected = parseDate(dateElected);
    if (Number.isNaN(parsedDateElected.getTime())) {
      return NextResponse.json({ error: "Invalid elected date." }, { status: 400 });
    }

    const parsedTermEnd = termEndRaw ? parseDate(termEndRaw) : null;
    if (parsedTermEnd && Number.isNaN(parsedTermEnd.getTime())) {
      return NextResponse.json({ error: "Invalid term end date." }, { status: 400 });
    }

    const [officialRecord, municipality, barangay] = await Promise.all([
      prisma.sKOfficial.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          birthDate: true,
          sex: true,
          position: true,
          skFederationOfficer: true,
          skFederationLevel: true,
          skFederationPosition: true,
          municipalityId: true,
          municipality: true,
          barangayId: true,
          barangay: true,
          sitio: true,
          dateElected: true,
          termEnd: true,
          contactNo: true,
          address: true,
          user: { select: { image: true, faceEmbedding: true } },
        },
      }),
      prisma.municipality.findUnique({
        where: { id: municipalityId },
        select: { id: true, name: true, province: true },
      }),
      prisma.barangay.findUnique({
        where: { id: barangayId },
        select: { id: true, name: true, municipalityId: true },
      }),
    ]);

    if (!officialRecord) {
      return NextResponse.json(
        { error: "Official profile not found. Submit admission details first." },
        { status: 404 },
      );
    }

    if (!municipality) {
      return NextResponse.json({ error: "Selected municipality was not found." }, { status: 404 });
    }

    if (!barangay || barangay.municipalityId !== municipality.id) {
      return NextResponse.json(
        { error: "Selected barangay does not belong to selected municipality." },
        { status: 400 },
      );
    }

    let photoUrl: string | null = null;
    let photoInspection: InspectIdPhotoResult | null = null;
    const activePendingRequest = await prisma.officialProfileChangeRequest.findFirst({
      where: {
        officialId: officialRecord.id,
        requestedByUserId: session.user.id,
        status: ProfileChangeRequestStatus.PENDING,
      },
      select: { id: true },
    });

    if (activePendingRequest) {
      return NextResponse.json(
        { error: "You already have a profile change request awaiting Staff review." },
        { status: 409 },
      );
    }

    if (photo instanceof File && photo.size > 0) {
      if (photo.size > MAX_OFFICIAL_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "Photo is too large. Maximum size is 5MB." },
          { status: 400 },
        );
      }

      if (!OFFICIAL_PHOTO_MIME_TYPES[photo.type]) {
        return NextResponse.json(
          { error: "Unsupported photo format. Use JPG, PNG, or WEBP." },
          { status: 400 },
        );
      }

      console.info("[PHOTO] file validated");
      try {
        photoInspection = await inspectIdPhoto({
          imageBase64: Buffer.from(await photo.arrayBuffer()).toString("base64"),
          encryptedEmbedding: officialRecord.user?.faceEmbedding ?? undefined,
        });
      } catch {
        photoInspection = null;
      }
      if (photoInspection && !photoInspection.qualityPassed) {
        return NextResponse.json({ error: photoInspection.qualityMessage }, { status: 400 });
      }
      const savedPhoto = await saveOfficialProfilePhoto(photo, session.user.id);
      photoUrl = savedPhoto.photoUrl;
    }

    const currentSnapshot = {
      firstName: officialRecord.firstName,
      middleName: officialRecord.middleName,
      lastName: officialRecord.lastName,
      suffix: officialRecord.suffix,
      birthDate: officialRecord.birthDate?.toISOString() ?? null,
      sex: officialRecord.sex,
      position: officialRecord.position,
      skFederationOfficer: officialRecord.skFederationOfficer,
      skFederationLevel: officialRecord.skFederationLevel,
      skFederationPosition: officialRecord.skFederationPosition,
      municipalityId: officialRecord.municipalityId,
      municipality: officialRecord.municipality,
      barangayId: officialRecord.barangayId,
      barangay: officialRecord.barangay,
      sitio: officialRecord.sitio,
      dateElected: officialRecord.dateElected?.toISOString() ?? null,
      termEnd: officialRecord.termEnd?.toISOString() ?? null,
      contactNo: officialRecord.contactNo,
      address: officialRecord.address,
      photoUrl: officialRecord.user?.image ?? null,
    };
    const requestedChanges = {
      firstName,
      middleName: middleNameRaw || null,
      lastName,
      suffix: suffixRaw || null,
      birthDate: parsedBirthDate.toISOString(),
      sex,
      position,
      skFederationOfficer,
      skFederationLevel,
      skFederationPosition,
      municipalityId: municipality.id,
      municipality: municipality.name,
      province: municipality.province || "Oriental Mindoro",
      barangayId: barangay.id,
      barangay: barangay.name,
      sitio: sitioRaw || null,
      dateElected: parsedDateElected.toISOString(),
      termEnd: parsedTermEnd?.toISOString() ?? officialRecord.termEnd?.toISOString() ?? null,
      contactNo: contactNoRaw || null,
      address: addressRaw || null,
      photoFaceDetected: photoInspection?.detectedFaces === 1 && photoInspection.qualityPassed,
      photoQualityChecked: photoInspection !== null,
    };

    const requestRecord = await prisma.officialProfileChangeRequest.create({
      data: {
        officialId: officialRecord.id,
        requestedByUserId: session.user.id,
        municipalityId: officialRecord.municipalityId ?? municipality.id,
        requestedChanges,
        currentSnapshot,
        requestedPhotoUrl: photoUrl,
        faceCheckStatus: photoUrl ? (photoInspection?.matched === true ? "MATCHED" : photoInspection?.matched === false ? "MISMATCHED" : "UNAVAILABLE") : "NOT_CHECKED",
        faceMatchScore: photoInspection?.matchScore ?? null,
      },
      select: {
        id: true,
        status: true,
        requestedPhotoUrl: true,
        faceCheckStatus: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message:
          "Your profile update has been submitted for Municipal Staff review. Your Digital ID will continue to show your last approved information until the change is approved.",
        data: requestRecord,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("PATCH /api/official/profile error:", getSafePhotoErrorMessage(error));
    }
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
