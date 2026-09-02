import { OfficialOtpPurpose, Role } from "@prisma/client";
import { hash as hashPassword } from "bcryptjs";
import { NextResponse } from "next/server";

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


type SendOtpMode = "LOGIN" | "REGISTER";

type SendOfficialOtpBody = {
  mode?: SendOtpMode;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
};

const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const MIN_PASSWORD_LENGTH = 8;

const isValidMode = (value: unknown): value is SendOtpMode =>
  value === "LOGIN" || value === "REGISTER";

const normalizeEmail = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";
const getSafeErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

async function sendOfficialOtpEmail(params: {
  to: string;
  code: string;
  mode: SendOtpMode;
}) {
  await sendEmail({
    to: params.to,
    subject: "SKTech Official Verification Code",
    text: `Your SKTech ${params.mode.toLowerCase()} verification code is ${params.code}. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <div style="background: linear-gradient(135deg, #0b2b6a, #0e3a8a); color: #ffffff; padding: 20px; border-radius: 12px 12px 0 0;">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">SK Provincial Federation</p>
          <h1 style="margin: 8px 0 0; font-size: 20px;">Official Authentication Code</h1>
        </div>
        <div style="border: 1px solid #dbe4ff; border-top: 0; padding: 20px; border-radius: 0 0 12px 12px; background: #f8fbff;">
          <p style="margin: 0 0 12px;">Use this one-time code to continue your <strong>${params.mode.toLowerCase()}</strong> request:</p>
          <p style="margin: 0; font-size: 28px; letter-spacing: 0.22em; font-weight: 700; color: #0b2b6a;">${params.code}</p>
          <p style="margin: 14px 0 0; font-size: 13px; color: #334155;">
            This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this code, ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

export async function POST(request: Request) {
  try {
    let body: SendOfficialOtpBody;
    try {
      body = (await request.json()) as SendOfficialOtpBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!isValidMode(body.mode)) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const mode = body.mode;
    const email = normalizeEmail(body.email);
    console.info("[OTP] Official OTP request received", { mode, email });

    if (!GMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Only @gmail.com email addresses are allowed." },
        { status: 400 },
      );
    }

    const now = new Date();
    const latestOtp = await prisma.officialOTP.findFirst({
      where: {
        email,
        purpose: mode === "REGISTER" ? OfficialOtpPurpose.REGISTER : OfficialOtpPurpose.LOGIN,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (latestOtp) {
      const elapsed = now.getTime() - latestOtp.createdAt.getTime();
      if (elapsed < OTP_REQUEST_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((OTP_REQUEST_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
            retryAfterSeconds,
          },
          { status: 429 },
        );
      }
    }

    let firstName: string | null = null;
    let lastName: string | null = null;
    let passwordHash: string | null = null;

    if (mode === "LOGIN") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });

      if (!existingUser || existingUser.role !== Role.OFFICIAL) {
        return NextResponse.json(
          { error: "Official account not found for this email." },
          { status: 404 },
        );
      }
    } else {
      const submittedFirstName = body.firstName?.trim() ?? "";
      const submittedLastName = body.lastName?.trim() ?? "";
      const password = body.password ?? "";
      const confirmPassword = body.confirmPassword ?? "";
      const hasFreshRegistrationPayload =
        submittedFirstName.length > 0 &&
        submittedLastName.length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0;

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }

      if (hasFreshRegistrationPayload) {
        if (password.length < MIN_PASSWORD_LENGTH) {
          return NextResponse.json(
            { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
            { status: 400 },
          );
        }

        if (password !== confirmPassword) {
          return NextResponse.json(
            { error: "Password and confirm password do not match." },
            { status: 400 },
          );
        }

        firstName = submittedFirstName;
        lastName = submittedLastName;
        passwordHash = await hashPassword(password, 10);
      } else {
        const latestRegisterPayload = await prisma.officialOTP.findFirst({
          where: {
            email,
            purpose: OfficialOtpPurpose.REGISTER,
          },
          orderBy: { createdAt: "desc" },
          select: {
            firstName: true,
            lastName: true,
            passwordHash: true,
          },
        });

        if (
          !latestRegisterPayload?.firstName ||
          !latestRegisterPayload?.lastName ||
          !latestRegisterPayload.passwordHash
        ) {
          return NextResponse.json(
            {
              error:
                "Registration details are required for the first OTP request.",
            },
            { status: 400 },
          );
        }

        firstName = latestRegisterPayload.firstName;
        lastName = latestRegisterPayload.lastName;
        passwordHash = latestRegisterPayload.passwordHash;
      }
    }

    await prisma.officialOTP.deleteMany({
      where: {
        email,
        purpose: mode === "REGISTER" ? OfficialOtpPurpose.REGISTER : OfficialOtpPurpose.LOGIN,
      },
    });

    const otpCode = generateOtpCode();
    console.info("[OTP] Official OTP generated", { mode, email });
    const record = await prisma.officialOTP.create({
      data: {
        email,
        code: hashOtpCode(otpCode),
        purpose: mode === "REGISTER" ? OfficialOtpPurpose.REGISTER : OfficialOtpPurpose.LOGIN,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash: passwordHash || null,
        expiresAt: getOtpExpiryDate(now),
      },
      select: {
        id: true,
        email: true,
        purpose: true,
        expiresAt: true,
      },
    });
    console.info("[OTP] Official OTP stored", { mode, email, otpId: record.id });

    try {
      console.info("[OTP] Attempting official OTP email delivery", { mode, email });
      await sendOfficialOtpEmail({
        to: email,
        code: otpCode,
        mode,
      });
      console.info("[OTP] Official OTP email sent", { mode, email });
    } catch (emailError) {
      await prisma.officialOTP
        .delete({ where: { id: record.id } })
        .catch(() => undefined);

      const message = getSafeErrorMessage(emailError);
      console.error("[OTP] Email delivery failed:", message);
      const isConfigError = message.includes("Missing email server environment variables");
      const isTimeoutError =
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("timed out") ||
        message.toLowerCase().includes("etimedout");
      const isBrevoAuthorizedIpError =
        message.toLowerCase().includes("unrecognised ip address") ||
        message.toLowerCase().includes("authorized ip") ||
        message.toLowerCase().includes("authorised ip");

      return NextResponse.json(
        {
          error: isConfigError
            ? "Email service is not configured. Set EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, and EMAIL_FROM in Railway."
            : isBrevoAuthorizedIpError
              ? "Brevo rejected this server IP. Add the Railway outbound IP to Brevo Authorized IPs or disable Brevo API IP restrictions."
              : isTimeoutError
              ? "Email service timed out while sending the OTP. Try again in a moment or check the Railway email/SMTP settings."
              : "Failed to send OTP email. Please try again later.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Verification code sent successfully.",
        email: record.email,
        mode,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        cooldownSeconds: OTP_REQUEST_COOLDOWN_SECONDS,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/official/send-otp error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}



