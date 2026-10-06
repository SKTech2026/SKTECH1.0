import { KKProfileStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getChairScope } from "@/lib/kk";

export async function PATCH(request: Request) {
  const scope = await getChairScope();
  if (!scope) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  let body: { id?: unknown; status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.id !== "string" || body.id.length > 100 || typeof body.status !== "string") return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const next = body.status;
  if (!new Set<string>([KKProfileStatus.VERIFIED, KKProfileStatus.NEEDS_CORRECTION, KKProfileStatus.REJECTED, KKProfileStatus.ARCHIVED]).has(next)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const previous = next === KKProfileStatus.ARCHIVED ? [KKProfileStatus.VERIFIED, KKProfileStatus.REJECTED, KKProfileStatus.NEEDS_CORRECTION] : [KKProfileStatus.PENDING_VERIFICATION];
  const updated = await prisma.kKMemberProfile.updateMany({
    where: { id: body.id, municipalityId: scope.municipalityId, barangayId: scope.barangayId, status: { in: previous } },
    data: { status: next as KKProfileStatus, reviewedAt: new Date() },
  });
  if (!updated.count) return NextResponse.json({ error: "Profile unavailable or status changed." }, { status: 409 });
  return NextResponse.json({ status: next });
}
