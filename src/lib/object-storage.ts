import "server-only";

import { createObjectStorage } from "@/lib/object-storage-core";

let storage: ReturnType<typeof createObjectStorage> | undefined;

function configuredStorage() {
  if (storage) return storage;
  const endpoint = process.env.RAILWAY_BUCKET_ENDPOINT;
  const bucket = process.env.RAILWAY_BUCKET_S3_NAME;
  const accessKeyId = process.env.RAILWAY_BUCKET_ACCESS_KEY_ID;
  const secretAccessKey = process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Object storage is not configured.");
  }
  storage = createObjectStorage({ endpoint, bucket, accessKeyId, secretAccessKey,
    region: process.env.RAILWAY_BUCKET_REGION || "auto" });
  return storage;
}

export async function uploadObject(namespace: string, objectPath: string, bytes: Buffer, contentType: string) {
  await configuredStorage().upload(namespace, objectPath, bytes, contentType);
}

export async function downloadObject(namespace: string, objectPath: string): Promise<Blob> {
  return configuredStorage().download(namespace, objectPath);
}

export async function deleteObject(namespace: string, objectPath: string) {
  await configuredStorage().remove(namespace, objectPath);
}
