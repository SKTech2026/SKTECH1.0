import { Role, UserStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  buildOfficialPhotoUrl,
  getSafePhotoErrorMessage,
  getOfficialPhotoContentType,
  isOfficialPhotoObjectPath,
  OFFICIAL_PROFILE_PHOTOS_BUCKET,
} from "@/lib/official-photo-storage";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const unavailableResponse = (message: string) => {
  console.error(`[PHOTO] photo serve failed: ${message}`);
  return NextResponse.json({ error: "Official photo is unavailable." }, { status: 404 });
};

export async function GET(request: NextRequest) {
  try {
    console.info("[PHOTO] serve request received");
    const guard = await requireApiRole([Role.ADMIN, Role.STAFF, Role.OFFICIAL], {
      requireApproved: false,
    });
    if (guard.error) {
      return guard.error;
    }

    if (
      (guard.session.user.role === Role.ADMIN || guard.session.user.role === Role.STAFF) &&
      guard.session.user.status !== UserStatus.APPROVED
    ) {
      return NextResponse.json({ error: "Account is not approved." }, { status: 403 });
    }

    if (guard.session.user.role === Role.STAFF && !guard.session.user.municipalityPresidentId) {
      return NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      );
    }

    const objectPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
    if (!isOfficialPhotoObjectPath(objectPath)) {
      console.error("[PHOTO] photo serve failed: Invalid official photo path.");
      return NextResponse.json({ error: "Invalid official photo path." }, { status: 400 });
    }
    console.info("[PHOTO] requested object path valid");

    const photoUrl = buildOfficialPhotoUrl(objectPath);
    const official = await prisma.sKOfficial.findFirst({
      where: {
        user: {
          image: photoUrl,
          role: Role.OFFICIAL,
        },
      },
      select: {
        id: true,
        userId: true,
        municipalityId: true,
      },
    });

    if (!official) {
      return unavailableResponse("No Official database reference found.");
    }

    if (guard.session.user.role === Role.OFFICIAL && official.userId !== guard.session.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (
      guard.session.user.role === Role.STAFF &&
      official.municipalityId !== guard.session.user.municipalityPresidentId
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    console.info("[PHOTO] database ownership/reference found");

    const contentType = getOfficialPhotoContentType(objectPath);
    if (!contentType) {
      console.error("[PHOTO] photo serve failed: Invalid official photo type.");
      return NextResponse.json({ error: "Invalid official photo type." }, { status: 400 });
    }

    console.info("[PHOTO] downloading from Supabase");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(OFFICIAL_PROFILE_PHOTOS_BUCKET)
      .download(objectPath);

    if (error || !data) {
      return unavailableResponse(
        error ? getSafePhotoErrorMessage(error) : "Supabase returned no photo data.",
      );
    }
    console.info("[PHOTO] download success");

    const imageBytes = await data.arrayBuffer();
    console.info("[PHOTO] response returning");
    return new NextResponse(imageBytes, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(`[PHOTO] photo serve failed: ${getSafePhotoErrorMessage(error)}`);
    return NextResponse.json({ error: "Failed to load official photo." }, { status: 500 });
  }
}
