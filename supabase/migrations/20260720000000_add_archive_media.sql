alter table public.archive_items
  add column if not exists content_type text not null default 'link' check (
    content_type in ('link', 'image', 'video')
  ),
  add column if not exists storage_path text,
  add column if not exists media_mime_type text,
  add column if not exists media_size bigint;

alter table public.archive_items
  add column if not exists search_text text generated always as (
    lower(
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(note, '') || ' ' ||
      coalesce(url, '') || ' ' ||
      coalesce(site_name, '')
    )
  ) stored;

drop index if exists public.archive_items_search_idx;

create index if not exists archive_items_search_idx
  on public.archive_items
  using gin (search_text gin_trgm_ops)
  where deleted_at is null;

create index if not exists archive_items_content_type_idx
  on public.archive_items (content_type)
  where deleted_at is null;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'archive-media',
  'archive-media',
  true,
  52428800,
  array[
    'image/avif',
    'image/gif',
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
