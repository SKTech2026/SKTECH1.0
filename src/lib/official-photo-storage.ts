import { randomUUID } from "node:crypto";

import {
  createSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/utils/supabase/admin";

export const OFFICIAL_PROFILE_PHOTOS_BUCKET = "official-profile-photos";
export const MAX_OFFICIAL_PHOTO_BYTES = 5 * 1024 * 1024;

export const OFFICIAL_PHOTO_MIME_TYPES: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PHOTO_CONTENT_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const OFFICIAL_PHOTO_PATH_PATTERN =
  /^officials\/[a-zA-Z0-9_-]{1,64}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

function normalizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

export function isOfficialPhotoObjectPath(objectPath: string): boolean {
  return OFFICIAL_PHOTO_PATH_PATTERN.test(objectPath);
}

export function buildOfficialPhotoUrl(objectPath: string): string {
  return `/api/official/photo?path=${encodeURIComponent(objectPath)}`;
}

export function getOfficialPhotoContentType(objectPath: string): string | null {
  const match = objectPath.match(OFFICIAL_PHOTO_PATH_PATTERN);
  return match ? (PHOTO_CONTENT_TYPES[match[1].toLowerCase()] ?? null) : null;
}

function isMissingBucketError(error: {
  status?: number;
  statusCode?: string;
  code?: string;
}): boolean {
  return (
    error.status === 404 ||
    error.statusCode === "404" ||
    error.code === "NoSuchBucket" ||
    error.code === "BucketNotFound"
  );
}

async function ensureOfficialPhotosBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: bucket, error } = await supabase.storage.getBucket(
    OFFICIAL_PROFILE_PHOTOS_BUCKET,
  );

  if (!error && bucket) {
    if (bucket.public) {
      throw new Error("Official profile photo storage must use a private bucket.");
    }
    return supabase;
  }

  if (error && !isMissingBucketError(error)) {
    throw new Error(`Unable to inspect official photo storage: ${error.message}`);
  }

  const { error: createError } = await supabase.storage.createBucket(
    OFFICIAL_PROFILE_PHOTOS_BUCKET,
    {
      public: false,
      fileSizeLimit: MAX_OFFICIAL_PHOTO_BYTES,
      allowedMimeTypes: Object.keys(OFFICIAL_PHOTO_MIME_TYPES),
    },
  );

  if (createError) {
    const { data: existingBucket, error: lookupError } = await supabase.storage.getBucket(
      OFFICIAL_PROFILE_PHOTOS_BUCKET,
    );

    if (lookupError || !existingBucket || existingBucket.public) {
      throw new Error(`Unable to prepare official photo storage: ${createError.message}`);
    }
  }

  return supabase;
}

export async function saveOfficialProfilePhoto(
  photo: File,
  userId: string,
): Promise<{ objectPath: string; photoUrl: string }> {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase Storage is not configured for official profile photos.");
  }

  const extension = OFFICIAL_PHOTO_MIME_TYPES[photo.type];
  if (!extension) {
    throw new Error("Unsupported photo format. Use JPG, PNG, or WEBP.");
  }
  if (photo.size === 0) {
    throw new Error("Photo is empty.");
  }
  if (photo.size > MAX_OFFICIAL_PHOTO_BYTES) {
    throw new Error("Photo is too large. Maximum size is 5MB.");
  }

  const cleanUserId = normalizeUserId(userId);
  if (!cleanUserId) {
    throw new Error("Unable to determine the official photo owner.");
  }

  const photoBuffer = Buffer.from(await photo.arrayBuffer());
  const objectPath = `officials/${cleanUserId}/${randomUUID()}.${extension}`;
  const supabase = await ensureOfficialPhotosBucket();
  const { error } = await supabase.storage
    .from(OFFICIAL_PROFILE_PHOTOS_BUCKET)
    .upload(objectPath, photoBuffer, {
      cacheControl: "3600",
      contentType: photo.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Unable to upload official profile photo: ${error.message}`);
  }

  return {
    objectPath,
    photoUrl: buildOfficialPhotoUrl(objectPath),
  };
}
