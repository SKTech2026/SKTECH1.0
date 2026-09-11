/**
 * Load the active ID template from the database.
 * 
 * This is a server-only helper that queries for the active template
 * without modifying any data.
 */

import { prisma } from "@/lib/db";

export interface DbIdTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  version: number;
  canvasWidth: number;
  canvasHeight: number;
  createdById: string | null;
  updatedById: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fields: DbIdTemplateField[];
  assets: DbIdTemplateAsset[];
}

export interface DbIdTemplateField {
  id: string;
  templateId: string;
  side: string;
  type: string;
  sourceKey: string | null;
  staticValue: string | null;
  label: string | null;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  zIndex: number;
  fit: string | null;
  radius: number | null;
  styleJson: Record<string, unknown> | null;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbIdTemplateAsset {
  id: string;
  templateId: string;
  side: string;
  kind: string;
  objectPath: string | null;
  publicUrl: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

/**
 * Load the currently active ID template from the database.
 *
 * Returns the template with all fields and assets ordered for rendering.
 * Returns null if no active template is found.
 *
 * Safety:
 * - Read-only operation, no DB writes
 * - Queries for isActive = true AND status = ACTIVE
 * - Includes all fields and assets
 * - Orders fields by side and zIndex for consistent rendering
 */
export async function loadActiveIdTemplate(): Promise<DbIdTemplate | null> {
  try {
    const template = await prisma.idTemplate.findFirst({
      where: {
        isActive: true,
        status: "ACTIVE",
      },
      include: {
        fields: {
          where: { visible: true },
          orderBy: [{ side: "asc" }, { zIndex: "asc" }, { createdAt: "asc" }],
        },
        assets: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!template) {
      return null;
    }

    return template as DbIdTemplate;
  } catch (error) {
    console.error("Failed to load active ID template:", error instanceof Error ? error.message : String(error));
    return null;
  }
}
