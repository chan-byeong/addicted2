import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ArchiveItem,
  ArchiveItemInput,
  ArchiveItemRow,
  ArchiveItemUpdateInput,
  ItemListParams,
} from "@/types/archive";

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

  let query = supabase
    .from("archive_items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.date) {
    query = query.eq("entry_date", params.date);
  }

  if (params.sourceType && params.sourceType !== "all") {
    query = query.eq("source_type", params.sourceType);
  }

  if (params.query) {
    const search = `%${params.query}%`;
    query = query.or(
      [
        `title.ilike.${search}`,
        `description.ilike.${search}`,
        `note.ilike.${search}`,
        `url.ilike.${search}`,
        `site_name.ilike.${search}`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as ArchiveItemRow[]).map(mapArchiveItem);
}

export async function createArchiveItem(input: ArchiveItemInput) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("archive_items")
    .insert(toInsertRow(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  return mapArchiveItem(data as ArchiveItemRow);
}

export async function softDeleteArchiveItem(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("archive_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
