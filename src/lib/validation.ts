import { z } from "zod";
import { isDateKey } from "@/lib/date";
import { SOURCE_TYPES } from "@/types/archive";

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

const itemPayloadSchema = z.object({
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

export const createItemSchema = itemPayloadSchema;

export const upsertItemSchema = itemPayloadSchema.extend({
  password: z.string().min(1),
});

export const itemListParamsSchema = z.object({
  date: dateKeySchema.optional(),
  query: z.string().trim().max(120).optional(),
  sourceType: z.enum([...SOURCE_TYPES, "all"]).optional(),
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
