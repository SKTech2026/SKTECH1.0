import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { DEFAULT_ID_TEMPLATE, type IdTemplate } from "@/components/id-template/default-template";
import { SKTECH_PROVINCIAL_ID_TEMPLATE } from "@/components/id-template/provincial-id-template";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";
import { loadActiveIdTemplate, type DbIdTemplate } from "@/lib/id-template/load-active-id-template";
import { convertDbTemplateToRendererTemplate } from "@/lib/id-template/db-to-renderer-converter";
import { validateIdTemplateOrDefault } from "@/lib/id-template/validate-template";
import IdTemplatePreviewClient from "./id-template-preview-client";

export const dynamic = "force-dynamic";

type AdminIdTemplatePreviewPageProps = {
  searchParams: Promise<{ templateId?: string; design?: string }>;
};

export default async function AdminIdTemplatePreviewPage({ searchParams }: AdminIdTemplatePreviewPageProps) {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);
  const { templateId, design } = await searchParams;

  let template: IdTemplate = DEFAULT_ID_TEMPLATE;
  let templateName: string | null = null;
  let activeTemplateId: string | undefined;
  let templateUpdatedAt: string | undefined;
  let sourcePreview = false;

  if (templateId) {
    const draft = await prisma.idTemplate.findFirst({
      where: { id: templateId, status: "DRAFT", isActive: false },
      include: {
        fields: { orderBy: [{ side: "asc" }, { zIndex: "asc" }, { createdAt: "asc" }] },
        assets: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!draft) notFound();
    templateName = draft.name;
    templateUpdatedAt = draft.updatedAt.toISOString();
    const rendererTemplate = convertDbTemplateToRendererTemplate(draft as DbIdTemplate);
    if (!rendererTemplate) notFound();
    template = validateIdTemplateOrDefault(rendererTemplate);
  } else if (design === "provincial") {
    template = SKTECH_PROVINCIAL_ID_TEMPLATE;
    templateName = "SKTECH Provincial Official ID - Modern Government v1 (Source Preview)";
    sourcePreview = true;
  } else {
    try {
      const dbTemplate = await loadActiveIdTemplate();
      if (dbTemplate) {
        templateName = dbTemplate.name;
        activeTemplateId = dbTemplate.id;
        templateUpdatedAt = dbTemplate.updatedAt.toISOString();
        const rendererTemplate = convertDbTemplateToRendererTemplate(dbTemplate);
        if (rendererTemplate) {
          template = validateIdTemplateOrDefault(rendererTemplate);
        }
      }
    } catch (error) {
      console.error("Failed to load active ID template for preview:", error instanceof Error ? error.message : String(error));
    }
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
      templateId={templateId}
      activeTemplateId={activeTemplateId}
      templateUpdatedAt={templateUpdatedAt}
      draftPreview={Boolean(templateId)}
      sourcePreview={sourcePreview}
    />
  );
}
