-- setup-photos-storage.sql
-- Creates the photos table, RLS policies, and helper notes for Supabase Storage.
--
-- Run this in the Supabase SQL Editor AFTER running the main setup in README-SUPABASE.md.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- IMPORTANT — also do these steps MANUALLY in the Supabase dashboard:
--
-- BUCKET 1: "photos"  (public bucket)
--   Storage → New bucket → name: "photos" → Public bucket: YES → Create
--   Then add these Storage policies (Storage → photos → Policies):
--
--   Policy 1 — Public read (all files in bucket are public)
--     Name:       Public read photos
--     Operation:  SELECT
--     Roles:      anon, authenticated
--     USING:      bucket_id = 'photos'
--
--   Policy 2 — Authenticated users can upload
--     Name:       Auth insert photos
--     Operation:  INSERT
--     Roles:      authenticated
--     WITH CHECK: bucket_id = 'photos'
--
--   Policy 3 — Uploader can delete own photos
--     Name:       Uploader delete own photos
--     Operation:  DELETE
--     Roles:      authenticated
--     USING:      bucket_id = 'photos' AND owner = auth.uid()
--
--   Policy 4 — Uploader can update own photos
--     Name:       Uploader update own photos
--     Operation:  UPDATE
--     Roles:      authenticated
--     USING:      bucket_id = 'photos' AND owner = auth.uid()
--
-- BUCKET 2: "photos-private"  (private bucket)
--   Storage → New bucket → name: "photos-private" → Public bucket: NO → Create
--   Then add this Storage policy (Storage → photos-private → Policies):
--
--   Policy 5 — Owner can view own private photos
--     Name:       Uploader read own private photos
--     Operation:  SELECT
--     Roles:      authenticated
--     USING:      bucket_id = 'photos-private' AND owner = auth.uid()
--
--   (Also add INSERT / DELETE / UPDATE policies for photos-private identical to
--    policies 2-4 above but with bucket_id = 'photos-private'.)
--
-- NOTE: Do NOT use a "visibility" column — it does not exist in Supabase Storage.
--       Privacy is controlled by which bucket the file is in (photos vs photos-private)
--       and by the is_private column in the photos database table.
-- ─────────────────────────────────────────────────────────────────────────────

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

-- Anyone can read public photos
create policy "public read photos"
  on photos for select
  using (is_private = false);

-- Authenticated users can read their own private photos
create policy "uploader read own private photos"
  on photos for select
  using (auth.uid() = uploader_id);

-- Authenticated users can insert their own photos
create policy "auth insert photos"
  on photos for insert
  with check (auth.uid() is not null);

-- Uploader can delete their own photos
create policy "uploader delete own photos"
  on photos for delete
  using (auth.uid() = uploader_id);

-- Uploader can update their own photos
create policy "uploader update own photos"
  on photos for update
  using (auth.uid() = uploader_id);
