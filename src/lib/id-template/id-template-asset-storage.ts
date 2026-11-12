import { randomUUID } from "node:crypto";

import { uploadObject, downloadObject, deleteObject } from "@/lib/object-storage";
import { hasFileSignature } from "@/lib/file-signatures";

export const ID_TEMPLATE_ASSETS_BUCKET = "id-template-assets";
export const MAX_ID_TEMPLATE_ASSET_BYTES = 2 * 1024 * 1024;

const ID_TEMPLATE_ASSET_MIME_TYPES: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TEMPLATE_ASSET_PATH_PATTERN =
  /^id-templates\/[a-zA-Z0-9_-]{1,64}\/[a-zA-Z0-9_-]{1,64}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

function normalizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

function extensionFromFileName(fileName: string) {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "jpg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  return null;
}

export function buildIdTemplateAssetUrl(assetId: string) {
  return `/api/id-template/assets/${encodeURIComponent(assetId)}`;
}

export function resolveIdTemplateAssetMimeType(storedMimeType: string | null, objectPath: string) {
  const normalizedMimeType = storedMimeType?.trim().toLowerCase();
  if (normalizedMimeType && ID_TEMPLATE_ASSET_MIME_TYPES[normalizedMimeType]) {
    return normalizedMimeType;
  }

  const extension = objectPath.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
}

export function isIdTemplateAssetObjectPath(objectPath: string) {
  return TEMPLATE_ASSET_PATH_PATTERN.test(objectPath);
}

export async function uploadIdTemplateImageAsset(file: File, templateId: string, assetId: string) {
  const extension = ID_TEMPLATE_ASSET_MIME_TYPES[file.type];
  if (!extension) {
    throw new Error("Unsupported image format. Use JPG, PNG, or WEBP.");
  }

  if (extensionFromFileName(file.name) !== extension) {
    throw new Error("Image file extension does not match its content type.");
  }

  if (file.size === 0) {
    throw new Error("Image file is empty.");
  }

  if (file.size > MAX_ID_TEMPLATE_ASSET_BYTES) {
    throw new Error("Image is too large. Maximum size is 2MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasFileSignature(bytes, file.type)) {
    throw new Error("Image file content does not match an allowed image type.");
  }

  const cleanTemplateId = normalizeId(templateId);
  const cleanAssetId = normalizeId(assetId);
  if (!cleanTemplateId || !cleanAssetId) {
    throw new Error("Unable to determine the template asset path.");
  }

  const objectPath = `id-templates/${cleanTemplateId}/${cleanAssetId}/${randomUUID()}.${extension}`;
  await uploadObject(ID_TEMPLATE_ASSETS_BUCKET, objectPath, bytes, file.type);

  return {
    objectPath,
    mimeType: file.type,
  };
}

export async function downloadIdTemplateImageAsset(objectPath: string) {
  if (!isIdTemplateAssetObjectPath(objectPath)) {
    throw new Error("Invalid ID template asset path.");
  }

  return downloadObject(ID_TEMPLATE_ASSETS_BUCKET, objectPath);
}

export async function deleteIdTemplateImageAsset(objectPath: string) {
  if (!isIdTemplateAssetObjectPath(objectPath)) return;

  await deleteObject(ID_TEMPLATE_ASSETS_BUCKET, objectPath);
}
