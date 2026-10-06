import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChairScope } from "@/lib/kk";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, status: true, municipalityPresidentId: true } });
  if (!user || user.status !== UserStatus.APPROVED) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  let where: { municipalityId?: string; barangayId?: string } = {};
  if (user.role === Role.OFFICIAL) {
    const scope = await getChairScope();
    if (!scope) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    where = { municipalityId: scope.municipalityId, barangayId: scope.barangayId };
  } else if (user.role === Role.STAFF) {
    if (!user.municipalityPresidentId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    where = { municipalityId: user.municipalityPresidentId };
  } else if (user.role !== Role.ADMIN) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const counts = await prisma.kKMemberProfile.groupBy({ by: ["status"], where, _count: { _all: true } });
  return NextResponse.json({ counts: counts.map(row => ({ status: row.status, count: row._count._all })) });
}
