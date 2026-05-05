import { createHash, randomInt, timingSafeEqual } from "crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
export const OTP_REQUEST_COOLDOWN_SECONDS = 60;
export const OTP_REQUEST_COOLDOWN_MS = OTP_REQUEST_COOLDOWN_SECONDS * 1000;

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export function getOtpExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + OTP_EXPIRY_MS);
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function verifyOtpCode(inputCode: string, hashedCode: string): boolean {
  const hashedInput = hashOtpCode(inputCode);
  const inputBuffer = Buffer.from(hashedInput);
  const storedBuffer = Buffer.from(hashedCode);

  if (inputBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, storedBuffer);
}
