import { Prisma } from "@prisma/client";

import {
  SKTECH_PROVINCIAL_ID_TEMPLATE,
  SKTECH_PROVINCIAL_ID_TEMPLATE_ID,
  SKTECH_PROVINCIAL_ID_TEMPLATE_NAME,
} from "@/components/id-template/provincial-id-template";
import { extractFields } from "@/lib/id-template/default-template-to-db";

type TemplateTransaction = Pick<Prisma.TransactionClient, "idTemplate">;

export async function createProvincialIdTemplateDraft(
  tx: TemplateTransaction,
  createdById: string,
) {
  const existing = await tx.idTemplate.findUnique({
    where: { id: SKTECH_PROVINCIAL_ID_TEMPLATE_ID },
    select: { id: true, name: true, status: true, isActive: true },
  });

  if (existing) {
    if (existing.name !== SKTECH_PROVINCIAL_ID_TEMPLATE_NAME || existing.status !== "DRAFT" || existing.isActive) {
      throw new Error("The reserved provincial ID template ID already belongs to a non-draft template.");
    }
    return { ...existing, created: false };
  }

  const nameConflict = await tx.idTemplate.findFirst({
    where: { name: SKTECH_PROVINCIAL_ID_TEMPLATE_NAME },
    select: { id: true },
  });
  if (nameConflict) {
    throw new Error("A template already uses the reserved provincial ID template name.");
  }

  const fields = extractFields(SKTECH_PROVINCIAL_ID_TEMPLATE);
  const template = await tx.idTemplate.create({
    data: {
      id: SKTECH_PROVINCIAL_ID_TEMPLATE_ID,
      name: SKTECH_PROVINCIAL_ID_TEMPLATE_NAME,
      description: "Editable SKTECH provincial official ID design. Created as an inactive draft; activation is a separate administrator decision.",
      status: "DRAFT",
      isActive: false,
      version: SKTECH_PROVINCIAL_ID_TEMPLATE.version,
      canvasWidth: SKTECH_PROVINCIAL_ID_TEMPLATE.canvas.width,
      canvasHeight: SKTECH_PROVINCIAL_ID_TEMPLATE.canvas.height,
      createdById,
      updatedById: createdById,
      fields: {
        create: fields.map(({ styleJson, ...field }) => ({
          ...field,
          visible: true,
          ...(styleJson ? { styleJson: styleJson as Prisma.InputJsonObject } : {}),
        })),
      },
    },
    select: { id: true, name: true, status: true, isActive: true },
  });

  return { ...template, created: true };
}
