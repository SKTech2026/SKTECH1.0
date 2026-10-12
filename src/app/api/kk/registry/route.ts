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
  const id = body.id;
  const next = body.status;
  if (!new Set<string>([KKProfileStatus.VERIFIED, KKProfileStatus.NEEDS_CORRECTION, KKProfileStatus.REJECTED, KKProfileStatus.ARCHIVED]).has(next)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (next === KKProfileStatus.REJECTED) {
    const deleted = await prisma.$transaction(async (tx) => {
      const profile = await tx.kKMemberProfile.findFirst({ where: { id, municipalityId: scope.municipalityId, barangayId: scope.barangayId, status: KKProfileStatus.PENDING_VERIFICATION }, select: { userId: true } });
      if (!profile) return false;
      await tx.user.delete({ where: { id: profile.userId } });
      return true;
    });
    if (!deleted) return NextResponse.json({ error: "Profile unavailable or status changed." }, { status: 409 });
    return NextResponse.json({ status: next });
  }
  const previous = next === KKProfileStatus.ARCHIVED ? [KKProfileStatus.VERIFIED, KKProfileStatus.NEEDS_CORRECTION] : [KKProfileStatus.PENDING_VERIFICATION];
  const updated = await prisma.kKMemberProfile.updateMany({
    where: { id: body.id, municipalityId: scope.municipalityId, barangayId: scope.barangayId, status: { in: previous } },
    data: { status: next as KKProfileStatus, reviewedAt: new Date() },
  });
  if (!updated.count) return NextResponse.json({ error: "Profile unavailable or status changed." }, { status: 409 });
  return NextResponse.json({ status: next });
}
