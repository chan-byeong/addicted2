create extension if not exists pg_trgm;

create table if not exists public.archive_items (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text not null,
  description text,
  image_url text,
  site_name text,
  source_type text not null check (
    source_type in ('youtube', 'shorts', 'community', 'other')
  ),
  note text,
  author_name text not null,
  entry_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists archive_items_entry_date_idx
  on public.archive_items (entry_date desc, created_at desc)
  where deleted_at is null;

create index if not exists archive_items_source_type_idx
  on public.archive_items (source_type)
  where deleted_at is null;

create index if not exists archive_items_search_idx
  on public.archive_items
  using gin (
    (
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(note, '') || ' ' ||
      coalesce(url, '') || ' ' ||
      coalesce(site_name, '')
    ) gin_trgm_ops
  )
  where deleted_at is null;

create or replace function public.set_archive_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists archive_items_updated_at on public.archive_items;

create trigger archive_items_updated_at
before update on public.archive_items
for each row
execute function public.set_archive_items_updated_at();
