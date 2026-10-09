import "server-only";

import { DEFAULT_ID_TEMPLATE, type IdTemplate } from "@/components/id-template/default-template";
import { convertDbTemplateToRendererTemplate } from "@/lib/id-template/db-to-renderer-converter";
import { loadActiveIdTemplate } from "@/lib/id-template/load-active-id-template";
import { validateIdTemplateOrDefault } from "@/lib/id-template/validate-template";

export async function getOfficialIdTemplate(): Promise<IdTemplate> {
  try {
    const active = await loadActiveIdTemplate();
    const converted = active ? convertDbTemplateToRendererTemplate(active) : null;
    return converted ? validateIdTemplateOrDefault(converted) : DEFAULT_ID_TEMPLATE;
  } catch (error) {
    console.error("Failed to load active ID template:", error instanceof Error ? error.message : String(error));
    return DEFAULT_ID_TEMPLATE;
  }
}
