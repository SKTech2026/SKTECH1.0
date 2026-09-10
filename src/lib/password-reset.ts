import { createHash, randomBytes } from "node:crypto";

import { sendEmail } from "@/lib/email";

export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

export function generateResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiry(from = new Date()) {
  return new Date(from.getTime() + PASSWORD_RESET_EXPIRY_MS);
}

function getAppBaseUrl() {
  const configuredUrl =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.AUTH_URL?.trim();

  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  throw new Error("Application base URL is not configured.");
}

export function buildResetPasswordUrl(token: string) {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail({
    to: email,
    subject: "Reset your SKTECH Official password",
    text: `Hello,\n\nUse this link to reset your SKTECH Official password:\n${resetUrl}\n\nThis link expires in 1 hour and can only be used once. If you did not request this reset, you can ignore this email.\n\nSKTECH is a capstone project prototype system.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <div style="background: linear-gradient(135deg, #0b2b6a, #1452d9); color: #ffffff; padding: 20px; border-radius: 12px 12px 0 0;">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">SKTECH Official Portal</p>
          <h1 style="margin: 8px 0 0; font-size: 20px;">Reset your password</h1>
        </div>
        <div style="border: 1px solid #dbe4ff; border-top: 0; padding: 20px; border-radius: 0 0 12px 12px; background: #f8fbff;">
          <p style="margin: 0 0 16px;">Hello,</p>
          <p style="margin: 0 0 16px;">Use the button below to create a new password for your SKTECH Official account.</p>
          <p style="margin: 0 0 20px;"><a href="${resetUrl}" style="display: inline-block; border-radius: 8px; background: #1452d9; color: #ffffff; padding: 12px 18px; text-decoration: none; font-weight: 700;">Reset Password</a></p>
          <p style="margin: 0 0 10px; font-size: 13px; color: #334155;">This link expires in 1 hour and can only be used once.</p>
          <p style="margin: 0; font-size: 13px; color: #334155;">If you did not request this reset, ignore this email. SKTECH is a capstone project prototype system.</p>
        </div>
      </div>
    `,
  });
}
