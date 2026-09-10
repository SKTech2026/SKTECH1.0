import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  ORIENTAL_MINDORO_LOCATION_VALIDATION,
  ORIENTAL_MINDORO_LOCATIONS,
  getOrientalMindoroBarangayCount,
} from "@/data/oriental-mindoro-locations";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncOrientalMindoroLocations } from "@/lib/locations/oriental-mindoro-sync";

export const dynamic = "force-dynamic";

type SyncRequestBody = {
  dryRun?: boolean;
};

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.ADMIN || session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json(
        { error: "Only approved admin accounts can sync location data." },
        { status: 403 },
      ),
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (!currentUser || currentUser.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  return { session };
};

export async function GET() {
  return NextResponse.json(
    {
      metadata: ORIENTAL_MINDORO_LOCATIONS.metadata,
      lgus: ORIENTAL_MINDORO_LOCATIONS.lgus,
      totals: {
        lguCount: ORIENTAL_MINDORO_LOCATIONS.lgus.length,
        barangayCount: getOrientalMindoroBarangayCount(),
      },
      validation: ORIENTAL_MINDORO_LOCATION_VALIDATION,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: SyncRequestBody = {};
    try {
      body = (await request.json()) as SyncRequestBody;
    } catch {
      body = {};
    }

    const summary = await syncOrientalMindoroLocations({
      dryRun: body.dryRun ?? true,
    });

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("POST /api/locations/oriental-mindoro error:", error);
    }
    return NextResponse.json({ error: "Failed to sync Oriental Mindoro locations." }, { status: 500 });
  }
}
