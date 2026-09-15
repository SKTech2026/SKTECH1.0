import { randomUUID } from "node:crypto";

import {
  createSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/utils/supabase/admin";

export const ID_TEMPLATE_ASSETS_BUCKET = "id-template-assets";
export const MAX_ID_TEMPLATE_ASSET_BYTES = 2 * 1024 * 1024;

const ID_TEMPLATE_ASSET_MIME_TYPES: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TEMPLATE_ASSET_PATH_PATTERN =
  /^id-templates\/[a-zA-Z0-9_-]{1,64}\/[a-zA-Z0-9_-]{1,64}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{12}\.(jpg|png|webp)$/i;

type BucketError = {
  status?: number;
  statusCode?: string;
  code?: string;
  message?: string;
};

function isMissingBucketError(error: BucketError): boolean {
  return (
    error.status === 404 ||
    error.statusCode === "404" ||
    error.code === "NoSuchBucket" ||
    error.code === "BucketNotFound"
  );
}

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

function hasValidImageSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/png") {
    return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (mimeType === "image/jpeg") {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/webp") {
    return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  }

  return false;
}

async function ensureIdTemplateAssetsBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: bucket, error } = await supabase.storage.getBucket(ID_TEMPLATE_ASSETS_BUCKET);

  if (!error && bucket) {
    if (bucket.public) {
      throw new Error("ID template asset storage must use a private bucket.");
    }
    return supabase;
  }

  if (error && !isMissingBucketError(error)) {
    throw new Error(`Unable to inspect ID template asset storage: ${error.message}`);
  }

  const { error: createError } = await supabase.storage.createBucket(ID_TEMPLATE_ASSETS_BUCKET, {
    public: false,
    fileSizeLimit: MAX_ID_TEMPLATE_ASSET_BYTES,
    allowedMimeTypes: Object.keys(ID_TEMPLATE_ASSET_MIME_TYPES),
  });

  if (createError) {
    const { data: existingBucket, error: lookupError } = await supabase.storage.getBucket(ID_TEMPLATE_ASSETS_BUCKET);
    if (lookupError || !existingBucket || existingBucket.public) {
      throw new Error(`Unable to prepare ID template asset storage: ${createError.message}`);
    }
  }

  return supabase;
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
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase Storage is not configured for ID template assets.");
  }

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
  if (!hasValidImageSignature(bytes, file.type)) {
    throw new Error("Image file content does not match an allowed image type.");
  }

  const cleanTemplateId = normalizeId(templateId);
  const cleanAssetId = normalizeId(assetId);
  if (!cleanTemplateId || !cleanAssetId) {
    throw new Error("Unable to determine the template asset path.");
  }

  const objectPath = `id-templates/${cleanTemplateId}/${cleanAssetId}/${randomUUID()}.${extension}`;
  const supabase = await ensureIdTemplateAssetsBucket();
  const { error } = await supabase.storage.from(ID_TEMPLATE_ASSETS_BUCKET).upload(objectPath, bytes, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Unable to upload ID template asset: ${error.message}`);
  }

  return {
    objectPath,
    mimeType: file.type,
  };
}

export async function downloadIdTemplateImageAsset(objectPath: string) {
  if (!isIdTemplateAssetObjectPath(objectPath)) {
    throw new Error("Invalid ID template asset path.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(ID_TEMPLATE_ASSETS_BUCKET).download(objectPath);
  if (error || !data) {
    throw new Error("ID template asset not found.");
  }

  return data;
}

export async function deleteIdTemplateImageAsset(objectPath: string) {
  if (!isIdTemplateAssetObjectPath(objectPath)) return;

  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(ID_TEMPLATE_ASSETS_BUCKET).remove([objectPath]);
}
