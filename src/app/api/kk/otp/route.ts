import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getActiveInvitation } from "@/lib/kk";
import { generateOtpCode, getOtpExpiryDate, hashOtpCode, OTP_REQUEST_COOLDOWN_MS } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const invitation = await getActiveInvitation(typeof body.code === "string" ? body.code : "");
    if (!invitation) return NextResponse.json({ error: "Invitation unavailable." }, { status: 404 });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !firstName || !lastName || firstName.length > 100 || lastName.length > 100 || password.length < 10 || password.length > 128) {
      return NextResponse.json({ error: "Enter a valid email, name, and password of 10–128 characters." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "This email already has an account. Please sign in." }, { status: 409 });
    const previous = await prisma.kKRegistrationOTP.findUnique({ where: { invitationId_email: { invitationId: invitation.id, email } }, select: { createdAt: true } });
    if (previous && Date.now() - previous.createdAt.getTime() < OTP_REQUEST_COOLDOWN_MS) return NextResponse.json({ error: "Please wait before requesting another code." }, { status: 429 });
    const otp = generateOtpCode();
    const passwordHash = await hash(password, 10);
    const record = await prisma.kKRegistrationOTP.upsert({
      where: { invitationId_email: { invitationId: invitation.id, email } },
      create: { invitationId: invitation.id, email, firstName, lastName, passwordHash, codeHash: hashOtpCode(otp), expiresAt: getOtpExpiryDate() },
      update: { firstName, lastName, passwordHash, codeHash: hashOtpCode(otp), attempts: 0, expiresAt: getOtpExpiryDate(), createdAt: new Date() },
      select: { id: true },
    });
    try {
      await sendEmail({ to: email, subject: "SKTECH KK registration code", text: `Your KK registration code is ${otp}. It expires in 5 minutes.`, html: `<p>Your KK registration code is <strong>${otp}</strong>. It expires in 5 minutes.</p>` });
    } catch {
      await prisma.kKRegistrationOTP.deleteMany({ where: { id: record.id } });
      return NextResponse.json({ error: "Could not send verification email. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ message: "Verification code sent. It expires in 5 minutes." });
  } catch {
    return NextResponse.json({ error: "Unable to send code." }, { status: 500 });
  }
}
