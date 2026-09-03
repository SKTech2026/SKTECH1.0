import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  buildOfficialPhotoUrl,
  getOfficialPhotoContentType,
  isOfficialPhotoObjectPath,
  OFFICIAL_PROFILE_PHOTOS_BUCKET,
} from "@/lib/official-photo-storage";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const unavailableResponse = () =>
  NextResponse.json({ error: "Official photo is unavailable." }, { status: 404 });

export async function GET(request: NextRequest) {
  try {
    const objectPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
    if (!isOfficialPhotoObjectPath(objectPath)) {
      return NextResponse.json({ error: "Invalid official photo path." }, { status: 400 });
    }

    const photoUrl = buildOfficialPhotoUrl(objectPath);
    const official = await prisma.sKOfficial.findFirst({
      where: {
        user: {
          image: photoUrl,
          role: Role.OFFICIAL,
        },
      },
      select: { id: true },
    });

    if (!official) {
      return unavailableResponse();
    }

    const contentType = getOfficialPhotoContentType(objectPath);
    if (!contentType) {
      return NextResponse.json({ error: "Invalid official photo type." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(OFFICIAL_PROFILE_PHOTOS_BUCKET)
      .download(objectPath);

    if (error || !data) {
      return unavailableResponse();
    }

    return new NextResponse(await data.arrayBuffer(), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("GET /api/official/photo error:", message);
    }
    return NextResponse.json({ error: "Failed to load official photo." }, { status: 500 });
  }
}
