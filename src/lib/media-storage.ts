import "server-only";

import {
  ARCHIVE_MEDIA_BUCKET,
  getMediaExtension,
} from "@/lib/archive-media";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MediaUploadInput = {
  mimeType: string;
};

function createStoragePath(mimeType: string) {
  const extension = getMediaExtension(mimeType);

  if (!extension) {
    throw new Error("Unsupported media type");
  }

  const month = new Date().toISOString().slice(0, 7);
  return `${month}/${crypto.randomUUID()}.${extension}`;
}

export async function createSignedMediaUpload(input: MediaUploadInput) {
  const supabase = createServerSupabaseClient();
  const path = createStoragePath(input.mimeType);
  const { data, error } = await supabase.storage
    .from(ARCHIVE_MEDIA_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.token) {
    throw new Error(error?.message || "Could not create media upload URL");
  }

  return { path, token: data.token };
}

export async function resolveUploadedMedia(path: string) {
  const separatorIndex = path.lastIndexOf("/");
  const folder = path.slice(0, separatorIndex);
  const fileName = path.slice(separatorIndex + 1);
  const supabase = createServerSupabaseClient();
  const bucket = supabase.storage.from(ARCHIVE_MEDIA_BUCKET);
  const { data, error } = await bucket.list(folder, {
    limit: 10,
    search: fileName,
  });

  if (error || !data?.some((file) => file.name === fileName)) {
    throw new Error(error?.message || "Uploaded media was not found");
  }

  return bucket.getPublicUrl(path).data.publicUrl;
}

export async function removeUploadedMedia(path: string) {
  const supabase = createServerSupabaseClient();
  await supabase.storage.from(ARCHIVE_MEDIA_BUCKET).remove([path]);
}
