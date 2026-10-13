import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  buildResetPasswordUrl,
  generateResetToken,
  getPasswordResetExpiry,
  hashResetToken,
  sendPasswordResetEmail,
} from "@/lib/password-reset";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;
  const { userId } = await context.params;
  const account = await prisma.user.findFirst({
    where: { id: userId, role: { in: [Role.OFFICIAL, Role.KK_MEMBER] } },
    select: { id: true, email: true, kkProfile: { select: { email: true } } },
  });
  const email = account?.kkProfile?.email ?? account?.email;
  if (!account || !email) {
    return NextResponse.json({ error: "Account or registered email not found." }, { status: 404 });
  }

  const token = generateResetToken();
  const now = new Date();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashResetToken(token),
        expiresAt: getPasswordResetExpiry(now),
      },
    }),
  ]);

  try {
    await sendPasswordResetEmail(email, buildResetPasswordUrl(token), true);
  } catch {
    await prisma.passwordResetToken.updateMany({
      where: { userId, tokenHash: hashResetToken(token), usedAt: null },
      data: { usedAt: new Date() },
    });
    return NextResponse.json({ error: "Reset email could not be sent. No active reset link was left behind." }, { status: 502 });
  }

  await logAudit({ userId: guard.session.user.id, action: "ADMIN_PASSWORD_RESET_SENT", model: "User", recordId: userId });
  return NextResponse.json({ sent: true });
}
