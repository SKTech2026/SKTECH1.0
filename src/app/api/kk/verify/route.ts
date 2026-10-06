import { Role, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveInvitation } from "@/lib/kk";
import { verifyStoredOtpCode } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const invitation = await getActiveInvitation(typeof body.code === "string" ? body.code : "");
    if (!invitation) return NextResponse.json({ error: "Invitation unavailable." }, { status: 404 });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!/^\d{6}$/.test(otp)) return NextResponse.json({ error: "Enter the six-digit code." }, { status: 400 });
    const record = await prisma.kKRegistrationOTP.findUnique({ where: { invitationId_email: { invitationId: invitation.id, email } } });
    if (!record || record.expiresAt <= new Date() || record.attempts >= 5) return NextResponse.json({ error: "Code invalid or expired." }, { status: 400 });
    const claimed = await prisma.kKRegistrationOTP.updateMany({ where: { id: record.id, attempts: { lt: 5 }, expiresAt: { gt: new Date() } }, data: { attempts: { increment: 1 } } });
    if (!claimed.count || !await verifyStoredOtpCode(otp, record.codeHash)) return NextResponse.json({ error: "Code invalid or expired." }, { status: 400 });
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) throw new Error("Email already registered");
      const user = await tx.user.create({ data: { email, name: `${record.firstName} ${record.lastName}`, password: record.passwordHash, role: Role.KK_MEMBER, status: UserStatus.APPROVED, emailVerified: new Date() }, select: { id: true } });
      await tx.kKMemberProfile.create({ data: { userId: user.id, invitationId: invitation.id, municipalityId: invitation.municipalityId, barangayId: invitation.barangayId, firstName: record.firstName, lastName: record.lastName, email } });
      await tx.kKRegistrationOTP.delete({ where: { id: record.id } });
    });
    return NextResponse.json({ message: "Email verified. Your KK account is ready." });
  } catch {
    return NextResponse.json({ error: "Verification failed. Please sign in if your account was already created." }, { status: 400 });
  }
}
