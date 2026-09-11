import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { DEFAULT_ID_TEMPLATE, type IdTemplate } from "@/components/id-template/default-template";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";
import { loadActiveIdTemplate } from "@/lib/id-template/load-active-id-template";
import { convertDbTemplateToRendererTemplate } from "@/lib/id-template/db-to-renderer-converter";
import { validateIdTemplateOrDefault } from "@/lib/id-template/validate-template";
import IdTemplatePreviewClient from "./id-template-preview-client";

export const dynamic = "force-dynamic";

export default async function AdminIdTemplatePreviewPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);

  let template: IdTemplate = DEFAULT_ID_TEMPLATE;
  let templateName: string | null = null;

  try {
    const dbTemplate = await loadActiveIdTemplate();
    if (dbTemplate) {
      templateName = dbTemplate.name;
      const rendererTemplate = convertDbTemplateToRendererTemplate(dbTemplate);
      if (rendererTemplate) {
        template = validateIdTemplateOrDefault(rendererTemplate);
      }
    }
  } catch (error) {
    console.error("Failed to load active ID template for preview:", error instanceof Error ? error.message : String(error));
  }

  const frontFields = template.sides.front.fields;
  const backFields = template.sides.back.fields;
  const totalFields = frontFields.length + backFields.length;
  const hasQr = [...frontFields, ...backFields].some((field) => field.type === "qr");

  return (
    <IdTemplatePreviewClient
      template={template}
      templateName={templateName ?? "SKTECH Default Digital ID Template"}
      canvasWidth={template.canvas.width}
      canvasHeight={template.canvas.height}
      totalFields={totalFields}
      frontFields={frontFields.length}
      backFields={backFields.length}
      hasQr={hasQr}
    />
  );
}
