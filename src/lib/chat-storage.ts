import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/utils/supabase/admin";

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

  if (
    file.type &&
    !allowedMimeTypes.includes(file.type) &&
    !OFFICE_EXTENSIONS_WITH_UNRELIABLE_MIME.has(extension)
  ) {
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
    mimeType: file.type || allowedMimeTypes[0],
  };
}

async function ensureChatAttachmentsBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: bucket, error } = await supabase.storage.getBucket(CHAT_ATTACHMENTS_BUCKET);

  if (!error && bucket) {
    if (bucket.public) {
      throw new Error("Chat attachment storage must use a private bucket.");
    }
    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(
    CHAT_ATTACHMENTS_BUCKET,
    {
      public: false,
      fileSizeLimit: MAX_CHAT_ATTACHMENT_BYTES,
      allowedMimeTypes: Array.from(
        new Set(Object.values(CHAT_ATTACHMENT_MIME_TYPES).flat()),
      ),
    },
  );

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Unable to prepare chat attachment storage: ${createError.message}`);
  }

  return supabase;
}

export async function uploadChatAttachment(
  file: File,
  municipalityId: string,
  conversationId: string,
  messageId: string,
) {
  const metadata = assertAllowedAttachment(file);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const objectPath = [
    normalizePathSegment(municipalityId),
    normalizePathSegment(conversationId),
    normalizePathSegment(messageId),
    `${randomUUID()}-${metadata.fileName}`,
  ].join("/");

  const supabase = await ensureChatAttachmentsBucket();
  const { error } = await supabase.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType: metadata.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Unable to upload chat attachment: ${error.message}`);
  }

  return {
    objectPath,
    fileName: metadata.fileName,
    mimeType: metadata.mimeType,
    sizeBytes: fileBuffer.length,
  };
}

export async function deleteChatAttachmentObject(objectPath: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).remove([objectPath]);
}
