import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { KKCertificateType, Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChairScope, getKKUser } from "@/lib/kk";

const allowedTypes = new Set<KKCertificateType>([
  KKCertificateType.PARTICIPATION,
  KKCertificateType.ATTENDANCE,
  KKCertificateType.APPRECIATION,
  KKCertificateType.VOLUNTEER_SERVICE,
]);

const certificateNumber = () => {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 9).toUpperCase();
  return `KK-${year}-${suffix}`;
};

const verificationCode = () => randomUUID().replace(/-/g, "").slice(0, 14).toUpperCase();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === Role.KK_MEMBER) {
    const member = await getKKUser();
    if (!member) {
      return NextResponse.json({ error: "KK member access is required." }, { status: 403 });
    }

    const profile = await prisma.kKMemberProfile.findUnique({
      where: { userId: member.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ certificates: [] });
    }

    const certificates = await prisma.kKCertificate.findMany({
      where: { kkMemberProfileId: profile.id },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        certificateNumber: true,
        title: true,
        certificateType: true,
        description: true,
        issuedAt: true,
        status: true,
        verificationCode: true,
        kkMemberProfile: {
          select: {
            firstName: true,
            lastName: true,
            barangay: { select: { name: true } },
            municipality: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ certificates });
  }

  if (session.user.role === Role.OFFICIAL) {
    const scope = await getChairScope();
    if (!scope) {
      return NextResponse.json({ error: "Only SK Chairpersons may review barangay certificates." }, { status: 403 });
    }

    const certificates = await prisma.kKCertificate.findMany({
      where: {
        kkMemberProfile: {
          barangayId: scope.barangayId,
          municipalityId: scope.municipalityId,
        },
      },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        certificateNumber: true,
        title: true,
        certificateType: true,
        issuedAt: true,
        status: true,
        verificationCode: true,
        kkMemberProfile: {
          select: {
            firstName: true,
            lastName: true,
            barangay: { select: { name: true } },
            municipality: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ certificates });
  }

  return NextResponse.json({ certificates: [] });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = await getChairScope();
  if (!scope) {
    return NextResponse.json({ error: "Only SK Chairpersons may issue certificates." }, { status: 403 });
  }

  const payload = await request.json();
  const memberId = typeof payload?.memberId === "string" ? payload.memberId : "";
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const type = typeof payload?.type === "string" ? payload.type : "";
  const description = typeof payload?.description === "string" ? payload.description.trim() : "";
  const eventId = typeof payload?.eventId === "string" ? payload.eventId : null;

  if (!memberId || !title || !type || !allowedTypes.has(type as KKCertificateType)) {
    return NextResponse.json({ error: "Missing or invalid certificate details." }, { status: 400 });
  }

  const profile = await prisma.kKMemberProfile.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      status: true,
      barangayId: true,
      municipalityId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!profile || profile.status !== "VERIFIED") {
    return NextResponse.json({ error: "Only verified KK profiles can receive certificates." }, { status: 400 });
  }

  if (profile.barangayId !== scope.barangayId || profile.municipalityId !== scope.municipalityId) {
    return NextResponse.json({ error: "This member is outside your barangay scope." }, { status: 403 });
  }

  const certificate = await prisma.kKCertificate.create({
    data: {
      certificateNumber: certificateNumber(),
      kkMemberProfileId: profile.id,
      eventId,
      title,
      certificateType: type as KKCertificateType,
      description: description || null,
      issuedByUserId: session.user.id,
      status: "ISSUED",
      verificationCode: verificationCode(),
    },
    select: { id: true, certificateNumber: true, title: true, status: true },
  });

  return NextResponse.json({ success: true, certificate });
}
