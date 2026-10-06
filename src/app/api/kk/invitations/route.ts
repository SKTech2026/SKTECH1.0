import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getChairScope } from "@/lib/kk";

export const dynamic = "force-dynamic";

export async function POST() {
  const scope = await getChairScope();
  if (!scope) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const invitation = await prisma.kKInvitation.create({
    data: { code: randomBytes(24).toString("hex"), createdById: scope.userId, municipalityId: scope.municipalityId, barangayId: scope.barangayId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    select: { code: true, expiresAt: true },
  });
  return NextResponse.json({ path: `/kk/join/${invitation.code}`, expiresAt: invitation.expiresAt }, { status: 201 });
}
