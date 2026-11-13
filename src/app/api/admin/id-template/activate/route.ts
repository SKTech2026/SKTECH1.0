import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  activateSavedTemplate,
  deactivateToCodeDefault,
  TemplateActivationError,
} from "@/lib/id-template/template-activation";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  try {
    const templates = await prisma.idTemplate.findMany({
      where: { status: { in: ["ACTIVE", "DRAFT"] } },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        status: true,
        isActive: true,
        version: true,
        updatedAt: true,
        _count: { select: { fields: true, assets: true } },
      },
    });
    return NextResponse.json({ templates });
  } catch {
    return jsonError("Unable to load saved template versions.", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Payload must be an object.", 400);
  }

  const input = body as Record<string, unknown>;
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (input.useCodeDefault === true) {
        if (typeof input.expectedActiveTemplateId !== "string" || typeof input.expectedUpdatedAt !== "string") {
          throw new TemplateActivationError("An active template ID and version are required for rollback.", 400);
        }
        return {
          action: "CODE_DEFAULT" as const,
          ...await deactivateToCodeDefault(tx, {
            expectedActiveTemplateId: input.expectedActiveTemplateId,
            expectedUpdatedAt: input.expectedUpdatedAt,
          }),
        };
      }

      if (typeof input.templateId !== "string" || !input.templateId.trim() ||
          input.templateId.length > 80 || typeof input.expectedUpdatedAt !== "string") {
        throw new TemplateActivationError("A saved template ID and version are required.", 400);
      }
      return {
        action: "TEMPLATE" as const,
        ...await activateSavedTemplate(tx, {
          templateId: input.templateId.trim(),
          expectedUpdatedAt: input.expectedUpdatedAt,
          adminUserId: guard.session.user.id,
        }),
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof TemplateActivationError) {
      return jsonError(error.message, error.status);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return jsonError("Another template change happened concurrently. Reload the Designer and try again.", 409);
    }
    return jsonError("Template activation failed; no template changes were applied.", 500);
  }
}
