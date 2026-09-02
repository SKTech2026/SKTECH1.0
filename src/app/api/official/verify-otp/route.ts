import { OfficialOtpPurpose, Role, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { OTP_LENGTH, verifyStoredOtpCode } from "@/lib/otp";

export const dynamic = "force-dynamic";



type VerifyOtpMode = "LOGIN" | "REGISTER";

type VerifyOfficialOtpBody = {
  email?: string;
  code?: string;
  mode?: VerifyOtpMode;
};

const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);

const isValidMode = (value: unknown): value is VerifyOtpMode =>
  value === "LOGIN" || value === "REGISTER";

const normalizeEmail = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";

export async function POST(request: Request) {
  try {
    let body: VerifyOfficialOtpBody;
    try {
      body = (await request.json()) as VerifyOfficialOtpBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!isValidMode(body.mode)) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    const code = body.code?.trim() ?? "";
    const mode = body.mode;
    const purpose = mode === "REGISTER" ? OfficialOtpPurpose.REGISTER : OfficialOtpPurpose.LOGIN;
    console.info("[OTP] Official OTP verification request received", { mode, email });

    if (!GMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Only @gmail.com email addresses are allowed." },
        { status: 400 },
      );
    }

    if (!OTP_PATTERN.test(code)) {
      return NextResponse.json(
        { error: `OTP must be exactly ${OTP_LENGTH} digits.` },
        { status: 400 },
      );
    }

    const now = new Date();
    const otpRecord = await prisma.officialOTP.findFirst({
      where: {
        email,
        purpose,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP is invalid or expired." },
        { status: 400 },
      );
    }

    const otpMatches = await verifyStoredOtpCode(code, otpRecord.code);
    if (!otpMatches) {
      console.info("[OTP] Official OTP verification rejected", { mode, email });
      return NextResponse.json(
        { error: "OTP is invalid or expired." },
        { status: 400 },
      );
    }

    if (mode === "REGISTER") {
      if (!otpRecord.firstName || !otpRecord.lastName || !otpRecord.passwordHash) {
        return NextResponse.json(
          { error: "Missing registration details for verification." },
          { status: 400 },
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        await prisma.officialOTP.deleteMany({ where: { email, purpose } });
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }

      const fullName = `${otpRecord.firstName} ${otpRecord.lastName}`.trim();
      await prisma.$transaction([
        prisma.user.create({
          data: {
            name: fullName,
            email,
            password: otpRecord.passwordHash,
            role: Role.OFFICIAL,
            status: UserStatus.PENDING,
          },
        }),
        prisma.officialOTP.deleteMany({
          where: { email, purpose },
        }),
      ]);

      console.info("[OTP] Official registration verification successful", { mode, email });
      return NextResponse.json(
        {
          message:
            "Registration verified successfully. Your account has been created and is pending approval.",
          redirectTo: "/official/auth",
        },
        { status: 200 },
      );
    }

    const existingOfficial = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!existingOfficial || existingOfficial.role !== Role.OFFICIAL) {
      return NextResponse.json(
        { error: "Official account not found." },
        { status: 404 },
      );
    }

    await prisma.officialOTP.deleteMany({
      where: { email, purpose },
    });

    console.info("[OTP] Official login OTP verification successful", { mode, email });
    return NextResponse.json(
      {
        message: "Login OTP verified.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/official/verify-otp error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}



