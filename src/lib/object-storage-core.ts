import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const allowedObjectNamespaces = [
  "admission-proofs", "official-profile-photos", "sktech-feed-images",
  "sktech-public-news", "sktech-chat-documents", "id-template-assets",
] as const;

export function buildObjectKey(namespace: string, objectPath: string): string {
  if (!allowedObjectNamespaces.some((allowed) => allowed === namespace) ||
      !/^[a-zA-Z0-9._/-]{1,512}$/.test(objectPath) || objectPath.startsWith("/") ||
      objectPath.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid object path.");
  }
  return `${namespace}/${objectPath}`;
}

export type ObjectStorageConfig = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export function createObjectStorage(config: ObjectStorageConfig) {
  const url = new URL(config.endpoint);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Object storage endpoint must be an HTTPS base URL.");
  }
  const s3 = new S3Client({ endpoint: config.endpoint, region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: false });
  return {
    async upload(namespace: string, objectPath: string, bytes: Buffer, contentType: string) {
      await s3.send(new PutObjectCommand({ Bucket: config.bucket, Key: buildObjectKey(namespace, objectPath),
        Body: bytes, ContentType: contentType, IfNoneMatch: "*" }));
    },
    async download(namespace: string, objectPath: string): Promise<Blob> {
      const response = await s3.send(new GetObjectCommand({ Bucket: config.bucket,
        Key: buildObjectKey(namespace, objectPath) }));
      if (!response.Body) throw new Error("Object not found.");
      return new Blob([Buffer.from(await response.Body.transformToByteArray())],
        { type: response.ContentType || "application/octet-stream" });
    },
    async remove(namespace: string, objectPath: string) {
      await s3.send(new DeleteObjectCommand({ Bucket: config.bucket,
        Key: buildObjectKey(namespace, objectPath) }));
    },
    close() { s3.destroy(); },
  };
}
