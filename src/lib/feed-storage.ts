import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/utils/supabase/admin";

export const INTERNAL_FEED_BUCKET = "sktech-feed-images";
export const PUBLIC_NEWS_BUCKET = "sktech-public-news";
export const MAX_FEED_IMAGE_BYTES = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function cleanName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
}

function extensionForMimeType(mimeType: string) {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
}

export function assertFeedImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Images must be JPEG, PNG, or WEBP files.");
  }
  if (file.size === 0) throw new Error("Image file is empty.");
  if (file.size > MAX_FEED_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 25MB.");
  }
}

export function resolveFeedImageMimeType(storedMimeType: string | null, objectPath: string) {
  const normalizedMimeType = storedMimeType?.trim().toLowerCase();
  if (normalizedMimeType) return ALLOWED_IMAGE_TYPES.has(normalizedMimeType) ? normalizedMimeType : null;

  const extension = objectPath.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
}

async function ensureBucket(bucketName: string, isPublic: boolean) {
  const supabase = createSupabaseAdminClient();
  const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
  if (!error && bucket) {
    if (bucket.public !== isPublic) {
      throw new Error(`Storage bucket ${bucketName} has an unsafe visibility setting.`);
    }
    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: MAX_FEED_IMAGE_BYTES,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
    });
    if (updateError) throw new Error(`Unable to prepare image storage: ${updateError.message}`);
    return supabase;
  }
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: isPublic,
    fileSizeLimit: MAX_FEED_IMAGE_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Unable to prepare image storage: ${createError.message}`);
  }
  return supabase;
}

export async function uploadFeedImage(file: File, bucketName: string, prefix: string) {
  assertFeedImage(file);
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const fileName = `${randomUUID()}-${cleanName(file.name)}`;
  const objectPath = `${safePrefix}/${fileName}`;
  const supabase = await ensureBucket(bucketName, bucketName === PUBLIC_NEWS_BUCKET);
  const { error } = await supabase.storage.from(bucketName).upload(objectPath, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Unable to upload image: ${error.message}`);
  return { objectPath, mimeType: file.type, extension: extensionForMimeType(file.type) };
}

export async function downloadFeedImage(bucketName: string, objectPath: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(bucketName).download(objectPath);
  if (error || !data) throw new Error("Image not found.");
  return data;
}

export async function deleteFeedImage(bucketName: string, objectPath: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(bucketName).remove([objectPath]);
}
