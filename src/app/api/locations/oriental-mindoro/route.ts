import { NextResponse } from "next/server";

import {
  ORIENTAL_MINDORO_LOCATION_VALIDATION,
  ORIENTAL_MINDORO_LOCATIONS,
  getOrientalMindoroBarangayCount,
} from "@/data/oriental-mindoro-locations";

export const dynamic = "force-dynamic";


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

export async function POST() {
  return NextResponse.json(
    { error: "Geography imports are available only through the offline Railway importer." },
    { status: 405 },
  );
}
