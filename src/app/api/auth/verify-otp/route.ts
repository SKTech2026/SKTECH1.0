import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OTP_LENGTH, verifyOtpCode } from "@/lib/otp";

export const dynamic = "force-dynamic";



type VerifyOtpBody = {
  code?: string;
};

const UPGRADEABLE_ROLES = new Set<Role>([Role.ADMIN, Role.STAFF]);
const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email;

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: VerifyOtpBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const inputCode = typeof body.code === "string" ? body.code.trim() : "";
    if (!OTP_PATTERN.test(inputCode)) {
      return NextResponse.json(
        { error: `OTP must be exactly ${OTP_LENGTH} digits.` },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { id: true, email: true, role: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role !== Role.OFFICIAL) {
      return NextResponse.json(
        { error: "Only OFFICIAL users can verify role upgrades." },
        { status: 403 },
      );
    }

    const now = new Date();
    const codeRecord = await prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        role: true,
      },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { error: "OTP is invalid or expired." },
        { status: 400 },
      );
    }

    if (!verifyOtpCode(inputCode, codeRecord.code)) {
      return NextResponse.json(
        { error: "OTP is invalid or expired." },
        { status: 400 },
      );
    }

    if (!UPGRADEABLE_ROLES.has(codeRecord.role)) {
      return NextResponse.json(
        { error: "Requested role is not eligible for self-upgrade." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { role: codeRecord.role },
      }),
      prisma.verificationCode.deleteMany({
        where: { email: user.email },
      }),
    ]);

    return NextResponse.json(
      {
        message: `Role upgraded to ${codeRecord.role}.`,
        role: codeRecord.role,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}



