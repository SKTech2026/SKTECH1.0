import { randomUUID } from "node:crypto";

import { uploadObject, downloadObject, deleteObject } from "@/lib/object-storage";
import { hasFileSignature } from "@/lib/file-signatures";

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

export async function uploadFeedImage(file: File, bucketName: string, prefix: string) {
  assertFeedImage(file);
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const fileName = `${randomUUID()}-${cleanName(file.name)}`;
  const objectPath = `${safePrefix}/${fileName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasFileSignature(bytes, file.type)) {
    throw new Error("Image content does not match its declared type.");
  }
  await uploadObject(bucketName, objectPath, bytes, file.type);
  return { objectPath, mimeType: file.type, extension: extensionForMimeType(file.type) };
}

export async function downloadFeedImage(bucketName: string, objectPath: string) {
  return downloadObject(bucketName, objectPath);
}

export async function deleteFeedImage(bucketName: string, objectPath: string) {
  await deleteObject(bucketName, objectPath);
}
