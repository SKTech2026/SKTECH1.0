import { AdmissionStatus, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
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

const imageErrorResponse = (message: string, status = 404) => {
  console.error(`[PHOTO] photo serve failed: ${message}`);
  return new NextResponse(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

export async function GET(request: NextRequest) {
  try {
    console.info("[PHOTO] serve request received");
    const objectPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
    if (!isOfficialPhotoObjectPath(objectPath)) {
      return imageErrorResponse("Invalid official photo path.", 400);
    }
    console.info("[PHOTO] requested object path valid");

    const session = await getServerSession(authOptions);
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
        admissionStatus: true,
        status: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!official) {
      return imageErrorResponse("No Official database reference found.");
    }

    if (!session?.user?.id) {
      if (
        official.admissionStatus !== AdmissionStatus.APPROVED ||
        official.status !== OfficialStatus.ACTIVE ||
        official.user?.status !== UserStatus.APPROVED
      ) {
        return imageErrorResponse("Unauthenticated photo request is not for an active public credential.");
      }
    } else if (![Role.ADMIN, Role.STAFF, Role.OFFICIAL].includes(session.user.role)) {
      return imageErrorResponse("Photo request role is forbidden.", 403);
    } else if (
      (session.user.role === Role.ADMIN || session.user.role === Role.STAFF) &&
      session.user.status !== UserStatus.APPROVED
    ) {
      return imageErrorResponse("Photo request account is not approved.", 403);
    } else if (session.user.role === Role.STAFF && !session.user.municipalityPresidentId) {
      return imageErrorResponse("Staff account is not assigned to a municipality.", 403);
    } else if (session.user.role === Role.OFFICIAL && official.userId !== session.user.id) {
      return imageErrorResponse("Official photo request is not owned by the session user.", 403);
    } else if (
      session.user.role === Role.STAFF &&
      official.municipalityId !== session.user.municipalityPresidentId
    ) {
      return imageErrorResponse("Staff photo request is outside assigned municipality.", 403);
    }
    console.info("[PHOTO] database ownership/reference found");

    const contentType = getOfficialPhotoContentType(objectPath);
    if (!contentType) {
      return imageErrorResponse("Invalid official photo type.", 400);
    }

    console.info("[PHOTO] downloading from Supabase");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(OFFICIAL_PROFILE_PHOTOS_BUCKET)
      .download(objectPath);

    if (error || !data) {
      return imageErrorResponse(
        error ? getSafePhotoErrorMessage(error) : "Supabase returned no photo data.",
      );
    }
    console.info("[PHOTO] download success");

    const imageBytes = await data.arrayBuffer();
    if (imageBytes.byteLength === 0) {
      return imageErrorResponse("Supabase returned an empty photo object.");
    }

    console.info("[PHOTO] response returning");
    return new NextResponse(Buffer.from(imageBytes), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": contentType,
        "Content-Length": String(imageBytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(`[PHOTO] photo serve failed: ${getSafePhotoErrorMessage(error)}`);
    return imageErrorResponse("Failed to load official photo.", 500);
  }
}
