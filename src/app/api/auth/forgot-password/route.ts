import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  buildResetPasswordUrl,
  generateResetToken,
  getPasswordResetExpiry,
  hashResetToken,
  sendPasswordResetEmail,
} from "@/lib/password-reset";

export const dynamic = "force-dynamic";

const GENERIC_RESPONSE = {
  message: "If this account is registered, password reset instructions have been sent.",
};
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestAttempts = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const recentAttempts = (requestAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < REQUEST_WINDOW_MS,
  );
  recentAttempts.push(now);
  requestAttempts.set(key, recentAttempts);
  return recentAttempts.length > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { account?: unknown };
  const account = typeof body.account === "string" ? body.account.trim().toLowerCase() : "";
  const rateLimitKey = account || "anonymous";

  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }

  try {
    if (!account || account.length > 320) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const user = await prisma.user.findFirst({
      where: { email: account, role: Role.OFFICIAL },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const token = generateResetToken();
    const now = new Date();
    const resetUrl = buildResetPasswordUrl(token);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: getPasswordResetExpiry(now),
        },
      }),
    ]);

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch {
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, tokenHash: hashResetToken(token), usedAt: null },
        data: { usedAt: new Date() },
      });
    }
  } catch {
    // Keep the response generic to avoid account enumeration and sensitive detail leaks.
  }

  return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
