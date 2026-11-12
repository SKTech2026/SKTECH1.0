
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "SKTECH1.0" },
    { status: 200 }
  );
}
