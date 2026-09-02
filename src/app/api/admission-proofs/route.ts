import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { ADMISSION_PROOFS_BUCKET } from "@/lib/proof-storage";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const SIGNED_URL_EXPIRES_SECONDS = 60;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (
      session.user.status !== UserStatus.APPROVED ||
      (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF)
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const objectPath = request.nextUrl.searchParams.get("path")?.trim();
    if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid proof path." }, { status: 400 });
    }

    const proofDocumentUrl = `/api/admission-proofs?path=${encodeURIComponent(objectPath)}`;
    const proofRecord = await prisma.sKOfficial.findFirst({
      where: {
        proofDocumentUrl,
        ...(session.user.role === Role.STAFF
          ? { municipalityId: session.user.municipalityPresidentId ?? "" }
          : {}),
      },
      select: { id: true },
    });

    if (!proofRecord) {
      return NextResponse.json({ error: "Proof document is unavailable." }, { status: 404 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(ADMISSION_PROOFS_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_EXPIRES_SECONDS);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Proof document is unavailable." }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open proof document.";
    console.error("[ADMISSION_PROOF] signed URL failed:", message);
    return NextResponse.json({ error: "Unable to open proof document." }, { status: 500 });
  }
}
