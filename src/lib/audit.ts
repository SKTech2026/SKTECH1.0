import { prisma } from "./db";

interface LogAuditParams {
  userId?: string;
  action: string;
  model: string;
  recordId: string;
}

export async function logAudit({
  userId = "SYSTEM",
  action,
  model,
  recordId,
}: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        model,
        recordId,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Failed to log audit:", error);
  }
}

