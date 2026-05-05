import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { AdmissionProofUploadPayload } from "@/lib/sk-official";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const ALLOWED_PROOF_MIME_TYPES = new Set(Object.keys(MIME_EXTENSION_MAP));
const MAX_PROOF_BYTES = 6 * 1024 * 1024;

function parseProofDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid proof file encoding.");
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "proof";
}

function normalizePrefix(prefix: string): string {
  return prefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
}

export async function saveAdmissionProof(
  upload: AdmissionProofUploadPayload,
  prefix: string,
): Promise<{ proofDocumentUrl: string; proofDocumentName: string; proofDocumentType: string }> {
  const parsed = parseProofDataUrl(upload.dataUrl);
  const mimeType = upload.mimeType || parsed.mimeType;

  if (!ALLOWED_PROOF_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported proof file type. Use JPG, PNG, WEBP, or PDF.");
  }

  const buffer = Buffer.from(parsed.base64, "base64");
  if (buffer.length === 0) {
    throw new Error("Proof file is empty.");
  }
  if (buffer.length > MAX_PROOF_BYTES) {
    throw new Error("Proof file is too large. Maximum size is 6MB.");
  }

  const extension = MIME_EXTENSION_MAP[mimeType] ?? "bin";
  const cleanPrefix = normalizePrefix(prefix);
  const sourceName = sanitizeFileName(upload.fileName);
  const fileName = `${cleanPrefix}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "admission-proofs");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return {
    proofDocumentUrl: `/uploads/admission-proofs/${fileName}`,
    proofDocumentName: sourceName,
    proofDocumentType: mimeType,
  };
}
