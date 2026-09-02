import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  OTP_EXPIRY_MINUTES,
  OTP_REQUEST_COOLDOWN_MS,
  OTP_REQUEST_COOLDOWN_SECONDS,
} from "@/lib/otp";

export const dynamic = "force-dynamic";


type UpgradeRequestBody = {
  role?: Role;
};

const UPGRADEABLE_ROLES = new Set<Role>([Role.ADMIN, Role.STAFF]);

function parseRequestedRole(value: unknown): Role | null {
  if (value === Role.ADMIN || value === Role.STAFF) {
    return value;
  }

  return null;
}

async function sendOtpEmail(params: {
  to: string;
  code: string;
  role: Role;
}) {
  await sendEmail({
    to: params.to,
    subject: "SK Role Upgrade Verification Code",
    text: `Your OTP for upgrading your role to ${params.role} is ${params.code}. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `<p>Your OTP for upgrading your role to <strong>${params.role}</strong> is:</p>
<h2 style="letter-spacing: 0.2em;">${params.code}</h2>
<p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email;

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: UpgradeRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const requestedRole = parseRequestedRole(body.role);
    if (!requestedRole || !UPGRADEABLE_ROLES.has(requestedRole)) {
      return NextResponse.json(
        { error: "Role must be ADMIN or STAFF." },
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
        { error: "Only OFFICIAL users can request role upgrades." },
        { status: 403 },
      );
    }

    const now = new Date();
    const latestActiveCode = await prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (latestActiveCode) {
      const elapsed = now.getTime() - latestActiveCode.createdAt.getTime();
      if (elapsed < OTP_REQUEST_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil(
          (OTP_REQUEST_COOLDOWN_MS - elapsed) / 1000,
        );

        return NextResponse.json(
          {
            error: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
            retryAfterSeconds,
          },
          { status: 429 },
        );
      }
    }

    await prisma.verificationCode.deleteMany({
      where: { email: user.email },
    });

    const otpCode = generateOtpCode();
    const codeRecord = await prisma.verificationCode.create({
      data: {
        email: user.email,
        code: hashOtpCode(otpCode),
        role: requestedRole,
        expiresAt: getOtpExpiryDate(now),
      },
      select: { id: true },
    });

    try {
      await sendOtpEmail({
        to: user.email,
        code: otpCode,
        role: requestedRole,
      });
    } catch (error) {
      await prisma.verificationCode
        .delete({ where: { id: codeRecord.id } })
        .catch(() => undefined);

      if (process.env.NODE_ENV !== "production") console.error("Failed to send OTP email:", error);
      return NextResponse.json(
        { error: "Failed to send OTP email. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "OTP sent to your email.",
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        cooldownSeconds: OTP_REQUEST_COOLDOWN_SECONDS,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("request-upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}



