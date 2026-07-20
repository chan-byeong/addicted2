import type { ContentType } from "@/types/archive";

export const ARCHIVE_MEDIA_BUCKET = "archive-media";
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export const IMAGE_MIME_TYPES = [
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const MEDIA_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function getAllowedMimeTypes(contentType: ContentType) {
  if (contentType === "image") {
    return IMAGE_MIME_TYPES as readonly string[];
  }

  if (contentType === "video") {
    return VIDEO_MIME_TYPES as readonly string[];
  }

  return [];
}

export function getMediaSizeLimit(contentType: ContentType) {
  return contentType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

export function getMediaExtension(mimeType: string) {
  return MEDIA_EXTENSIONS[mimeType] ?? null;
}
