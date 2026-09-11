/**
 * Idempotent default ID template importer.
 * Reads DEFAULT_ID_TEMPLATE and creates/updates a single default active template.
 * 
 * Usage: npx tsx scripts/import-default-id-template.ts
 * 
 * Features:
 * - Idempotent: running multiple times doesn't create duplicates
 * - Transactional: updates fields and active state atomically
 * - Single active template: deactivates others before activating default
 */

import type { Prisma } from "@prisma/client";
import { DEFAULT_ID_TEMPLATE } from "../src/components/id-template/default-template";
import {
  extractFields,
  countFieldsBySide,
  hasQrField,
} from "../src/lib/id-template/default-template-to-db";
import { prisma } from "../src/lib/db";

const TEMPLATE_NAME = "SKTECH Default Digital ID Template";

interface ImportResult {
  success: boolean;
  templateId: string;
  message: string;
  fieldCount: number;
  frontCount: number;
  backCount: number;
  hasQr: boolean;
  isNew: boolean;
}

async function importDefaultTemplate(): Promise<ImportResult> {
  try {
    // Extract all fields from the code template
    const fields = extractFields(DEFAULT_ID_TEMPLATE);
    const fieldCounts = countFieldsBySide(fields);
    const frontCount = fieldCounts.FRONT;
    const backCount = fieldCounts.BACK;
    const hasQr = hasQrField(fields);

    console.log(`\n📋 Preparing default ID template import...`);
    console.log(`   Canvas: ${DEFAULT_ID_TEMPLATE.canvas.width}x${DEFAULT_ID_TEMPLATE.canvas.height}`);
    console.log(`   Total fields: ${fields.length} (front: ${frontCount}, back: ${backCount})`);
    console.log(`   QR field: ${hasQr ? "✓ yes" : "✗ no"}`);
    console.log(`   Template name: "${TEMPLATE_NAME}"\n`);

    // Check if template exists
    let template = await prisma.idTemplate.findFirst({
      where: { name: TEMPLATE_NAME },
      include: { fields: true },
    });

    const isNew = !template;

    if (isNew) {
      // Create new template
      console.log("🆕 Creating new default template...");
      template = await prisma.idTemplate.create({
        data: {
          name: TEMPLATE_NAME,
          description: "Default SKTECH official identification card template",
          status: "ACTIVE",
          isActive: true,
          version: DEFAULT_ID_TEMPLATE.version,
          canvasWidth: DEFAULT_ID_TEMPLATE.canvas.width,
          canvasHeight: DEFAULT_ID_TEMPLATE.canvas.height,
        },
        include: { fields: true },
      });
      console.log(`✓ Template created with ID: ${template.id}`);
    } else if (template) {
      // Update existing template metadata
      console.log(`♻️  Updating existing template (ID: ${template.id})...`);
      template = await prisma.idTemplate.update({
        where: { id: template.id },
        data: {
          status: "ACTIVE",
          isActive: true,
          version: DEFAULT_ID_TEMPLATE.version,
          canvasWidth: DEFAULT_ID_TEMPLATE.canvas.width,
          canvasHeight: DEFAULT_ID_TEMPLATE.canvas.height,
          updatedAt: new Date(),
        },
        include: { fields: true },
      });
      console.log(`✓ Template updated`);
    }

    if (!template) {
      throw new Error("Failed to create or find template");
    }

    // Deactivate all other templates
    if (!isNew) {
      // Only update other templates if this is an update
      const deactivatedCount = await prisma.idTemplate.updateMany({
        where: {
          id: { not: template.id },
          isActive: true,
        },
        data: {
          isActive: false,
          status: "DRAFT",
        },
      });
      if (deactivatedCount.count > 0) {
        console.log(`♻️  Deactivated ${deactivatedCount.count} other template(s)`);
      }
    }

    // Identify which fields to keep, update, or create
    const fieldsToDelete: string[] = [];

    // Mark fields for deletion if they're not in the new template
    for (const existingField of template.fields) {
      const codeFieldId = fields.findIndex(
        (f) =>
          f.side === existingField.side &&
          f.xPercent === existingField.xPercent &&
          f.yPercent === existingField.yPercent
      );
      if (codeFieldId === -1) {
        // This field doesn't exist in the new template
        fieldsToDelete.push(existingField.id);
      }
    }

    // Delete fields that are no longer in template
    if (fieldsToDelete.length > 0) {
      await prisma.idTemplateField.deleteMany({
        where: { id: { in: fieldsToDelete } },
      });
      console.log(`🗑️  Deleted ${fieldsToDelete.length} obsolete field(s)`);
    }

    // Create or update all fields from the code template
    for (const field of fields) {
      // Try to find existing field with same position and type
      const existingField = template.fields.find(
        (f) =>
          f.side === field.side &&
          f.type === field.type &&
          f.xPercent === field.xPercent &&
          f.yPercent === field.yPercent
      );

      if (existingField) {
        // Update existing field
        const updateData = {
          sourceKey: field.sourceKey,
          staticValue: field.staticValue,
          label: field.label,
          widthPercent: field.widthPercent,
          heightPercent: field.heightPercent,
          zIndex: field.zIndex,
          fit: field.fit,
          radius: field.radius,
          updatedAt: new Date(),
          ...(field.styleJson !== null ? { styleJson: field.styleJson } : {}),
        };
        await prisma.idTemplateField.update({
          where: { id: existingField.id },
          data: updateData as Prisma.IdTemplateFieldUpdateInput,
        });
      } else {
        // Create new field
        const createData: Prisma.IdTemplateFieldCreateInput = {
          template: { connect: { id: template.id } },
          side: field.side,
          type: field.type,
          sourceKey: field.sourceKey,
          staticValue: field.staticValue,
          label: field.label,
          xPercent: field.xPercent,
          yPercent: field.yPercent,
          widthPercent: field.widthPercent,
          heightPercent: field.heightPercent,
          zIndex: field.zIndex,
          fit: field.fit,
          radius: field.radius,
          ...(field.styleJson !== null ? { styleJson: field.styleJson } : {}),
        };
        await prisma.idTemplateField.create({
          data: createData,
        });
      }
    }

    console.log(`✓ Ensured ${fields.length} field(s) in template`);

    return {
      success: true,
      templateId: template.id,
      message: isNew ? "Default template created successfully" : "Default template updated successfully",
      fieldCount: fields.length,
      frontCount,
      backCount,
      hasQr,
      isNew,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Import failed: ${message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
(async () => {
  try {
    const result = await importDefaultTemplate();
    console.log(
      `\n✅ ${result.message}`
    );
    console.log(`   Template ID: ${result.templateId}`);
    console.log(`   Fields: ${result.fieldCount} (front: ${result.frontCount}, back: ${result.backCount})`);
    console.log(`   QR: ${result.hasQr ? "✓" : "✗"}`);
    console.log(`   Mode: ${result.isNew ? "NEW" : "UPDATE"}\n`);
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Fatal error during import:");
    console.error(error);
    process.exit(1);
  }
})();
