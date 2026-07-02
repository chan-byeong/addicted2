create extension if not exists pgcrypto;

create table if not exists public.maple_characters (
  id uuid primary key default gen_random_uuid(),
  ocid text not null unique,
  character_name text not null,
  world_name text,
  character_class text,
  character_level integer,
  character_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maple_characters_updated_at_idx
  on public.maple_characters (updated_at desc);

create or replace function public.set_maple_characters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists maple_characters_updated_at on public.maple_characters;

create trigger maple_characters_updated_at
before update on public.maple_characters
for each row
execute function public.set_maple_characters_updated_at();
