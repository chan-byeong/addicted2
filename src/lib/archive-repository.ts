import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ArchiveItem,
  ArchiveItemInput,
  ArchiveItemRow,
  ArchiveItemUpdateInput,
  ItemListParams,
} from "@/types/archive";

const QUERY_CANDIDATE_LIMIT = 200;
const SUPABASE_NO_ROWS_CODE = "PGRST116";

type SupabaseErrorLike = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function isSupabaseErrorLike(error: unknown): error is SupabaseErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as SupabaseErrorLike).message === "string"
  );
}

export class ArchiveRepositoryError extends Error {
  kind: "supabase" | "not_found";
  code?: string;
  details?: string;
  hint?: string;

  constructor({
    kind,
    message,
    code,
    details,
    hint,
    cause,
  }: {
    kind: "supabase" | "not_found";
    message: string;
    code?: string;
    details?: string;
    hint?: string;
    cause?: unknown;
  }) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ArchiveRepositoryError";
    this.kind = kind;
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export function toArchiveRepositoryError(
  error: unknown,
  kind: ArchiveRepositoryError["kind"] = "supabase",
  message?: string,
) {
  if (!isSupabaseErrorLike(error)) {
    return new ArchiveRepositoryError({
      kind,
      message: message ?? "Archive repository operation failed",
      cause: error,
    });
  }

  return new ArchiveRepositoryError({
    kind,
    message: message ?? error.message,
    code: error.code,
    details: error.details ?? undefined,
    hint: error.hint ?? undefined,
    cause: error,
  });
}

function isNotFoundSingleError(error: unknown) {
  return isSupabaseErrorLike(error) && error.code === SUPABASE_NO_ROWS_CODE;
}

function mapArchiveItem(row: ArchiveItemRow): ArchiveItem {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    siteName: row.site_name,
    sourceType: row.source_type,
    note: row.note,
    authorName: row.author_name,
    entryDate: row.entry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeQueryValue(value: string | undefined) {
  const normalized = value?.trim();

  return normalized && normalized.length > 0 ? normalized.toLowerCase() : null;
}

function getArchiveItemSearchText(item: Pick<ArchiveItem, "title" | "description" | "note" | "url" | "siteName">) {
  return [
    item.title,
    item.description,
    item.note,
    item.url,
    item.siteName,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join("\n")
    .toLowerCase();
}

export function matchesArchiveItemQuery(
  item: Pick<ArchiveItem, "title" | "description" | "note" | "url" | "siteName">,
  query: string,
) {
  const normalizedQuery = normalizeQueryValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return getArchiveItemSearchText(item).includes(normalizedQuery);
}

export function filterArchiveItemsByQuery(
  items: ArchiveItem[],
  query: string,
) {
  return items.filter((item) => matchesArchiveItemQuery(item, query));
}

function toInsertRow(input: ArchiveItemInput) {
  return {
    url: input.url,
    title: input.title,
    description: input.description ?? null,
    image_url: input.imageUrl ?? null,
    site_name: input.siteName ?? null,
    source_type: input.sourceType,
    note: input.note ?? null,
    author_name: input.authorName,
    entry_date: input.entryDate,
  };
}

function toUpdateRow(input: ArchiveItemUpdateInput) {
  return {
    ...(input.url === undefined ? {} : { url: input.url }),
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.imageUrl === undefined ? {} : { image_url: input.imageUrl }),
    ...(input.siteName === undefined ? {} : { site_name: input.siteName }),
    ...(input.sourceType === undefined ? {} : { source_type: input.sourceType }),
    ...(input.note === undefined ? {} : { note: input.note }),
    ...(input.authorName === undefined
      ? {}
      : { author_name: input.authorName }),
    ...(input.entryDate === undefined ? {} : { entry_date: input.entryDate }),
  };
}

export async function listArchiveItems(params: ItemListParams) {
  const supabase = createServerSupabaseClient();
  const limit = params.limit ?? 50;
  const hasQuery = Boolean(normalizeQueryValue(params.query));
  const candidateLimit = hasQuery ? Math.max(limit, QUERY_CANDIDATE_LIMIT) : limit;

  let queryBuilder = supabase
    .from("archive_items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.date) {
    queryBuilder = queryBuilder.eq("entry_date", params.date);
  }

  if (params.sourceType && params.sourceType !== "all") {
    queryBuilder = queryBuilder.eq("source_type", params.sourceType);
  }

  queryBuilder = queryBuilder.limit(candidateLimit);

  const { data, error } = await queryBuilder;

  if (error) {
    throw toArchiveRepositoryError(error);
  }

  const items = (data as ArchiveItemRow[]).map(mapArchiveItem);
  const filteredItems = hasQuery
    ? filterArchiveItemsByQuery(items, params.query ?? "")
    : items;

  return filteredItems.slice(0, limit);
}

export async function createArchiveItem(input: ArchiveItemInput) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("archive_items")
    .insert(toInsertRow(input))
    .select("*")
    .single();

  if (error) {
    throw toArchiveRepositoryError(error);
  }

  return mapArchiveItem(data as ArchiveItemRow);
}

export async function updateArchiveItem(
  id: string,
  input: ArchiveItemUpdateInput,
) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("archive_items")
    .update(toUpdateRow(input))
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) {
    throw toArchiveRepositoryError(error, "supabase");
  }

  return mapArchiveItem(data as ArchiveItemRow);
}

export async function softDeleteArchiveItem(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("archive_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    if (isNotFoundSingleError(error)) {
      throw toArchiveRepositoryError(error, "not_found", "Archive item not found");
    }

    throw toArchiveRepositoryError(error);
  }

  if (!data) {
    throw new ArchiveRepositoryError({
      kind: "not_found",
      message: "Archive item not found",
    });
  }
}
