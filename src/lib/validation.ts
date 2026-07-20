import { z } from "zod";
import {
  getAllowedMimeTypes,
  getMediaSizeLimit,
} from "@/lib/archive-media";
import { isDateKey } from "@/lib/date";
import { ARCHIVE_FILTER_TYPES, SOURCE_TYPES } from "@/types/archive";

const dateKeySchema = z.string().refine(isDateKey, {
  message: "Invalid date key",
});

const normalizedUrlSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => new URL(value).toString());

function nullableTrimmedStringSchema(maxLength: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }

    return value;
  }, z.union([z.string().max(maxLength), z.null()]));
}

function nullablePreservedStringSchema(maxLength: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === "string" && value.trim() === "") {
      return null;
    }

    return value;
  }, z.union([z.string().max(maxLength), z.null()]));
}

const nullableUrlSchema = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}, z.union([normalizedUrlSchema, z.null()]));

const nullableTextSchema = nullableTrimmedStringSchema(500);
const nullableNoteSchema = nullablePreservedStringSchema(500);
const nullableSiteNameSchema = nullableTrimmedStringSchema(120);

export const metadataRequestSchema = z.object({
  url: normalizedUrlSchema,
});

const linkItemPayloadSchema = z.object({
  contentType: z.literal("link").default("link"),
  url: normalizedUrlSchema,
  title: z.string().trim().min(1).max(180),
  description: nullableTextSchema,
  imageUrl: nullableUrlSchema,
  siteName: nullableSiteNameSchema,
  sourceType: z.enum(SOURCE_TYPES),
  note: nullableNoteSchema,
  authorName: z.string().trim().min(1).max(40),
  entryDate: dateKeySchema,
});

const mediaUploadFieldsSchema = z.object({
  contentType: z.enum(["image", "video"]),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(1).max(100),
  fileSize: z.number().int().positive(),
});

type MediaUploadFields = z.infer<typeof mediaUploadFieldsSchema>;

function validateMediaUpload(
  input: MediaUploadFields,
  context: z.RefinementCtx,
) {
  if (!getAllowedMimeTypes(input.contentType).includes(input.mimeType)) {
    context.addIssue({
      code: "custom",
      path: ["mimeType"],
      message: "Unsupported media type",
    });
  }

  if (input.fileSize > getMediaSizeLimit(input.contentType)) {
    context.addIssue({
      code: "custom",
      path: ["fileSize"],
      message: "Media file is too large",
    });
  }
}

const mediaItemPayloadSchema = mediaUploadFieldsSchema
  .extend({
    storagePath: z
      .string()
      .regex(/^\d{4}-\d{2}\/[0-9a-f-]{36}\.[a-z0-9]+$/),
    note: nullableNoteSchema,
    authorName: z.string().trim().min(1).max(40),
    entryDate: dateKeySchema,
  })
  .superRefine(validateMediaUpload);

const createItemPayloadSchema = z.union([
  linkItemPayloadSchema,
  mediaItemPayloadSchema,
]);

export const createItemSchema = z.preprocess((value) => {
  if (
    typeof value === "object" &&
    value !== null &&
    !("contentType" in value)
  ) {
    return { ...value, contentType: "link" };
  }

  return value;
}, createItemPayloadSchema);

export const upsertItemSchema = linkItemPayloadSchema.extend({
  password: z.string().min(1),
});

export const mediaUploadRequestSchema =
  mediaUploadFieldsSchema.superRefine(validateMediaUpload);

export const itemListParamsSchema = z.object({
  date: dateKeySchema.optional(),
  query: z.string().trim().max(120).optional(),
  sourceType: z.enum([...ARCHIVE_FILTER_TYPES, "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const mapleCharacterNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(30);

export const mapleOcidSchema = z
  .string()
  .trim()
  .min(1)
  .max(128);

export const createMapleCharacterSchema = z.object({
  characterName: mapleCharacterNameSchema,
});
