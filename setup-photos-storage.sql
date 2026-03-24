-- setup-photos-storage.sql
-- Creates the photos table, RLS policies, and helper notes for Supabase Storage.
--
-- Run this in the Supabase SQL Editor AFTER running the main setup in README-SUPABASE.md.
--
-- IMPORTANT — also do these two steps manually in the Supabase dashboard:
--   1. Storage → New bucket → name: "photos" → Public bucket: YES → Create
--   2. Storage → photos bucket → Policies → Add policy:
--        "Public read"   → Allowed operation: SELECT → Using expression: true
--        "Auth upload"   → Allowed operation: INSERT → Check expression: auth.uid() IS NOT NULL

-- ── PHOTOS TABLE ─────────────────────────────────────────────────────────────

create table if not exists photos (
  id           uuid    default gen_random_uuid() primary key,
  family_id    uuid    references families(id) on delete set null,
  uploader_id  uuid    references auth.users(id) on delete set null,
  path         text    not null,
  title_ro     text,
  title_en     text,
  caption_ro   text,
  caption_en   text,
  dedicatie_ro text,
  dedicatie_en text,
  year         integer,
  category     text,
  is_private   boolean default false,
  uploaded_at  timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────

alter table photos enable row level security;

-- Each policy is created inside a DO block so the script is safe to re-run:
-- if the policy already exists the duplicate_object exception is silently ignored.

-- Anyone can read public photos
do $$ begin
  create policy "public read photos"
    on photos for select
    using (is_private = false);
exception when duplicate_object then null;
end $$;

-- Authenticated users can read their own private photos
do $$ begin
  create policy "uploader read own private photos"
    on photos for select
    using (auth.uid() = uploader_id);
exception when duplicate_object then null;
end $$;

-- Authenticated users can insert their own photos
do $$ begin
  create policy "auth insert photos"
    on photos for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null;
end $$;

-- Uploader can delete their own photos
do $$ begin
  create policy "uploader delete own photos"
    on photos for delete
    using (auth.uid() = uploader_id);
exception when duplicate_object then null;
end $$;

-- Uploader can update their own photos
do $$ begin
  create policy "uploader update own photos"
    on photos for update
    using (auth.uid() = uploader_id);
exception when duplicate_object then null;
end $$;
