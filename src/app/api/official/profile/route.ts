import { OfficialPosition, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  MAX_OFFICIAL_PHOTO_BYTES,
  OFFICIAL_PHOTO_MIME_TYPES,
  saveOfficialProfilePhoto,
} from "@/lib/official-photo-storage";
import { positionToLegacyRole, toTermEndDate } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

function parsePosition(value: string): OfficialPosition | null {
  if (Object.values(OfficialPosition).includes(value as OfficialPosition)) {
    return value as OfficialPosition;
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
    const dateElected = String(formData.get("dateElected") ?? "").trim();
    const termEndRaw = String(formData.get("termEnd") ?? "").trim();
    const municipalityId = String(formData.get("municipalityId") ?? "").trim();
    const barangayId = String(formData.get("barangayId") ?? "").trim();
    const positionValue = String(formData.get("position") ?? "").trim();
    const contactNoRaw = String(formData.get("contactNo") ?? "").trim();
    const addressRaw = String(formData.get("address") ?? "").trim();
    const photo = formData.get("photo");

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

    const position = parsePosition(positionValue);
    if (!position) {
      return NextResponse.json({ error: "Invalid position." }, { status: 400 });
    }

    const parsedDateElected = parseDate(dateElected);
    if (Number.isNaN(parsedDateElected.getTime())) {
      return NextResponse.json({ error: "Invalid elected date." }, { status: 400 });
    }

    const computedTermEnd = termEndRaw || toTermEndDate(dateElected);
    const parsedTermEnd = parseDate(computedTermEnd);
    if (Number.isNaN(parsedTermEnd.getTime())) {
      return NextResponse.json({ error: "Invalid term end date." }, { status: 400 });
    }

    const [officialRecord, municipality, barangay] = await Promise.all([
      prisma.sKOfficial.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
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

      const savedPhoto = await saveOfficialProfilePhoto(photo, session.user.id);
      photoUrl = savedPhoto.photoUrl;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const official = await tx.sKOfficial.update({
        where: { id: officialRecord.id },
        data: {
          firstName,
          middleName: middleNameRaw || null,
          lastName,
          province: municipality.province || "Oriental Mindoro",
          municipalityId: municipality.id,
          municipality: municipality.name,
          barangayId: barangay.id,
          barangay: barangay.name,
          position,
          role: positionToLegacyRole(position),
          dateElected: parsedDateElected,
          termStart: parsedDateElected,
          termEnd: parsedTermEnd,
          contactNo: contactNoRaw || null,
          address: addressRaw || null,
        },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          position: true,
          municipality: true,
          barangay: true,
          municipalityId: true,
          barangayId: true,
          dateElected: true,
          termEnd: true,
          contactNo: true,
          address: true,
          updatedAt: true,
        },
      });

      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: `${firstName} ${lastName}`.trim(),
          ...(photoUrl ? { image: photoUrl } : {}),
        },
        select: {
          image: true,
        },
      });

      return {
        official,
        photoUrl: user.image,
      };
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully.",
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("PATCH /api/official/profile error:", message);
    }
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
