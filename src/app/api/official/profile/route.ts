import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { OfficialPosition, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { positionToLegacyRole, toTermEndDate } from "@/lib/sk-official";

export const dynamic = "force-dynamic";

const PHOTO_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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
      if (photo.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "Photo is too large. Maximum size is 5MB." },
          { status: 400 },
        );
      }

      const extension = PHOTO_MIME_TYPES[photo.type];
      if (!extension) {
        return NextResponse.json(
          { error: "Unsupported photo format. Use JPG, PNG, or WEBP." },
          { status: 400 },
        );
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads", "official-photos");
      await mkdir(uploadDir, { recursive: true });

      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      const fileName = `${session.user.id}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
      await writeFile(path.join(uploadDir, fileName), photoBuffer);
      photoUrl = `/uploads/official-photos/${fileName}`;
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
      console.error("PATCH /api/official/profile error:", error);
    }
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
