import { IdTemplateAssetKind, IdTemplateSide, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  buildIdTemplateAssetUrl,
  deleteIdTemplateImageAsset,
  MAX_ID_TEMPLATE_ASSET_BYTES,
  uploadIdTemplateImageAsset,
} from "@/lib/id-template/id-template-asset-storage";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isFile(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<File>;
  return (
    typeof candidate.arrayBuffer === "function" &&
    typeof candidate.size === "number" &&
    typeof candidate.type === "string"
  );
}

function readSide(value: FormDataEntryValue | null) {
  if (value !== IdTemplateSide.FRONT && value !== IdTemplateSide.BACK) {
    throw new Error("side must be FRONT or BACK.");
  }

  return value;
}

function classifyUploadError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return [
    "Unsupported image format",
    "extension",
    "empty",
    "too large",
    "content does not match",
    "side must be",
    "file is required",
  ].some((hint) => error.message.includes(hint));
}

export async function POST(request: Request) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const side = readSide(formData.get("side"));

    if (!isFile(file)) {
      return jsonError("Image file is required.", 400);
    }

    if (file.size > MAX_ID_TEMPLATE_ASSET_BYTES) {
      return jsonError("Image is too large. Maximum size is 2MB.", 413);
    }

    const activeTemplate = await prisma.idTemplate.findFirst({
      where: {
        isActive: true,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    if (!activeTemplate) {
      return jsonError("No active ID template found.", 404);
    }

    let objectPath: string | null = null;
    const asset = await prisma.idTemplateAsset.create({
      data: {
        templateId: activeTemplate.id,
        side,
        kind: IdTemplateAssetKind.IMAGE,
        objectPath: null,
        publicUrl: null,
        mimeType: file.type || null,
      },
      select: {
        id: true,
        kind: true,
        mimeType: true,
      },
    });

    try {
      const uploaded = await uploadIdTemplateImageAsset(file, activeTemplate.id, asset.id);
      objectPath = uploaded.objectPath;

      const savedAsset = await prisma.idTemplateAsset.update({
        where: { id: asset.id },
        data: {
          objectPath: uploaded.objectPath,
          publicUrl: null,
          mimeType: uploaded.mimeType,
        },
        select: {
          id: true,
          kind: true,
          mimeType: true,
        },
      });

      return NextResponse.json({
        success: true,
        asset: {
          id: savedAsset.id,
          kind: savedAsset.kind,
          url: buildIdTemplateAssetUrl(savedAsset.id),
          mimeType: savedAsset.mimeType,
          size: file.size,
        },
      });
    } catch (error) {
      if (objectPath) {
        await deleteIdTemplateImageAsset(objectPath).catch(() => null);
      }
      await prisma.idTemplateAsset.delete({ where: { id: asset.id } }).catch(() => null);
      throw error;
    }
  } catch (error) {
    if (classifyUploadError(error)) {
      return jsonError(error instanceof Error ? error.message : "Invalid image upload.", 400);
    }

    return jsonError("Unable to upload ID template asset.", 500);
  }
}
