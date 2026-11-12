import { randomUUID } from "node:crypto";

import { uploadObject, deleteObject } from "@/lib/object-storage";
import { hasFileSignature, hasOfficeContainerSignature } from "@/lib/file-signatures";

export const CHAT_ATTACHMENTS_BUCKET = "sktech-chat-documents";
export const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const CHAT_ATTACHMENT_MIME_TYPES: Readonly<Record<string, string[]>> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
};

const OFFICE_EXTENSIONS_WITH_UNRELIABLE_MIME = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
]);

function normalizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "attachment";
}

function getExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extension === "jpeg" ? "jpg" : extension;
}

function assertAllowedAttachment(file: File) {
  const fileName = sanitizeFileName(file.name);
  const extension = getExtension(fileName);
  const allowedMimeTypes = CHAT_ATTACHMENT_MIME_TYPES[extension];

  if (!allowedMimeTypes) {
    throw new Error("Unsupported attachment type.");
  }

  const isOffice = OFFICE_EXTENSIONS_WITH_UNRELIABLE_MIME.has(extension);
  if (file.type && !allowedMimeTypes.includes(file.type) &&
      !(isOffice && file.type === "application/octet-stream")) {
    throw new Error("Attachment type does not match the file extension.");
  }

  if (file.size === 0) {
    throw new Error("Attachment is empty.");
  }

  if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
    throw new Error("Attachment is too large. Maximum size is 10MB.");
  }

  return {
    fileName,
    extension,
    mimeType: allowedMimeTypes[0],
  };
}

export async function uploadChatAttachment(
  file: File,
  municipalityId: string,
  conversationId: string,
  messageId: string,
) {
  const metadata = assertAllowedAttachment(file);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const signatureMatches = OFFICE_EXTENSIONS_WITH_UNRELIABLE_MIME.has(metadata.extension)
    ? hasOfficeContainerSignature(fileBuffer, metadata.extension)
    : hasFileSignature(fileBuffer, metadata.mimeType);
  if (!signatureMatches) {
    throw new Error("Attachment content does not match its file type.");
  }
  const objectPath = [
    normalizePathSegment(municipalityId),
    normalizePathSegment(conversationId),
    normalizePathSegment(messageId),
    `${randomUUID()}-${metadata.fileName}`,
  ].join("/");

  await uploadObject(CHAT_ATTACHMENTS_BUCKET, objectPath, fileBuffer, metadata.mimeType);

  return {
    objectPath,
    fileName: metadata.fileName,
    mimeType: metadata.mimeType,
    sizeBytes: fileBuffer.length,
  };
}

export async function deleteChatAttachmentObject(objectPath: string) {
  await deleteObject(CHAT_ATTACHMENTS_BUCKET, objectPath);
}
