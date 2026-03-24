# CALNIC ONLINE — SITE BRIEFING
**Deep Audit Date:** 2026-03-24  
**Live Site:** https://calniconline.ro  
**Repository:** https://github.com/AngelOfSoul/Angelofsoul.github.io

---

## 1. FILE INVENTORY

| File | Type | Description |
|------|------|-------------|
| `index.html` | HTML | Home page — welcome, mission, how to join |
| `istorie.html` | HTML | Village History — timeline, photos, facts |
| `familiile.html` | HTML | Families Directory — list, search, filter |
| `familiile-familie.html` | HTML | Individual Family Page — story, members, timeline, photos |
| `genealogie.html` | HTML | Genealogy Overview — search families |
| `genealogie-familie.html` | HTML | Family Tree Viewer — interactive SVG tree |
| `galerie.html` | HTML | Photo Gallery — upload, view, categories |
| `harta.html` | HTML | Village Map — Leaflet.js interactive map |
| `login.html` | HTML | Family Account — sign in / register |
| `dashboard.html` | HTML | Private Family Dashboard — manage family data |
| `contact.html` | HTML | Contact Form — Formspree-powered |
| `intrebari.html` | HTML | FAQ — frequently asked questions |
| `404.html` | HTML | Page Not Found — friendly error page |
| `supabase.js` | JS | Shared Supabase client (CDN-loaded, event-dispatched) |
| `setup-photos-storage.sql` | SQL | Photos table + RLS policies for Supabase |
| `seed-demo-data.sql` | SQL | Demo families seed data (5 families, fixed UUIDs) |
| `README-SUPABASE.md` | MD | Full Supabase setup guide |
| `CNAME` | — | Custom domain: `calniconline.ro` |
| `og-image.png` | PNG | Open Graph social preview image |
| `CALNIC_PROJECT_BRIEFING_V10.txt` | TXT | Previous project briefing (superseded) |
| `CALNIC_PROJECT_BRIEFING_V11.txt` | TXT | Previous project briefing (superseded by this file) |

**Total: 21 files**

---

## 2. WHAT IS DONE ✅

### Infrastructure
- ✅ **GitHub Pages hosting** — free, live at https://calniconline.ro
- ✅ **CNAME file** — correctly set to `calniconline.ro`
- ✅ **Custom domain** — https://calniconline.ro is live and resolves correctly
- ✅ **supabase.js** — real credentials configured (not placeholders):
  - `SUPABASE_URL = 'https://qjgvhirmnxpqqcllzukp.supabase.co'`
  - `SUPABASE_ANON_KEY` = real JWT token (expires 2089)
  - CDN loading from `cdn.jsdelivr.net` (HTTPS)
  - Dispatches `supabase:ready` event for all pages
  - `isSupabaseConfigured()` helper correctly returns `true`

### Pages — All 13 Built and Functional
- ✅ **index.html** — home page, bilingual, full navigation
- ✅ **istorie.html** — village history, bilingual
- ✅ **familiile.html** — Supabase fetch with demo fallback, alpha filter, search
- ✅ **familiile-familie.html** — `Promise.all` parallel fetch (families + members + timeline), PIN verification via `supabase.rpc('check_family_pin', ...)`
- ✅ **genealogie.html** — Supabase fetch with demo fallback
- ✅ **genealogie-familie.html** — `Promise.all` parallel fetch (families + members), interactive SVG tree
- ✅ **galerie.html** — Supabase Storage fetch from `photos` bucket, 8-photo demo fallback, file upload with JPEG compression
- ✅ **harta.html** — Leaflet.js map using **Stadia Maps** tile URLs (already updated from Stamen):
  - Satellite: `https://server.arcgisonline.com/...`
  - Street: `https://{s}.tile.openstreetmap.org/...`
  - Labels: `https://tiles.stadiamaps.com/tiles/stamen_toner_labels/...` ✅
- ✅ **login.html** — Supabase Auth fully wired:
  - `signInWithPassword()` — sign in
  - `signUp()` — register new family
  - `resetPasswordForEmail()` — forgot password
  - `signOut()` — sign out
  - `getSession()` — session check on load
  - Redirect URLs: `https://calniconline.ro/login.html` and `https://calniconline.ro/dashboard.html`
- ✅ **dashboard.html** — private family dashboard, auth-gated
- ✅ **contact.html** — form wired to **Formspree** (`https://formspree.io/f/xpqygdjn`), includes error handling and success/failure UI
- ✅ **intrebari.html** — FAQ, bilingual
- ✅ **404.html** — friendly 404 page, bilingual

### UX / Consistency
- ✅ **Language switching (RO/EN)** — consistent across all 13 pages:
  - Uses `data-ro` / `data-en` attributes on all translatable elements
  - `localStorage('calnic-lang')` persists choice across pages
  - Language buttons in top bar on every page
- ✅ **Navigation** — identical nav bar on all pages (8 links + family login)
- ✅ **Footer** — consistent on all pages
- ✅ **No HTTP links** — all external resources use HTTPS
- ✅ **No TODO comments** in any HTML file
- ✅ **No JavaScript errors** in any HTML file (all async errors properly caught)

### SQL / Backend
- ✅ **setup-photos-storage.sql** exists — creates `photos` table with:
  - RLS: public can read non-private photos
  - RLS: authenticated users can read own private photos
  - RLS: authenticated users can insert
  - RLS: uploaders can update/delete own photos
  - Safe to re-run (uses `IF NOT EXISTS` + `DO $$` exception blocks)
- ✅ **seed-demo-data.sql** exists — 5 demo families with fixed UUIDs
- ✅ **README-SUPABASE.md** exists — full step-by-step setup guide

---

## 3. WHAT IS BROKEN ❌

### 🔴 BROKEN LINK — `editeaza-familia.html` does not exist
- **File:** `familiile-familie.html`, line 639
- **Code:** `editBtn.href = 'editeaza-familia.html?family=' + familyId;`
- **What happens:** When a logged-in family owner visits their own page and clicks the **"✎ Editeaza familia"** button, they are taken to `editeaza-familia.html` — **which does not exist** → 404 error
- **Fix options:**
  - Option A: Create `editeaza-familia.html` (the full family editor page)
  - Option B: Remove/disable the edit button until the page is created
  - Option C: Redirect to `dashboard.html` which already has edit functionality

---

## 4. WHAT IS MISSING ⚠️

### 🔴 HIGH PRIORITY
1. **`editeaza-familia.html`** — referenced in `familiile-familie.html` but never created. The edit button is broken until this is resolved.
2. **`photos` bucket in Supabase Storage** — must be created manually:
   - Supabase Dashboard → Storage → New bucket → Name: `photos` → Public: YES → Create
   - Then add policies: SELECT (public, `true`) and INSERT (authenticated, `auth.uid() IS NOT NULL`)
3. **Run `setup-photos-storage.sql`** — the `photos` table may not exist in the database yet. Run in Supabase → SQL Editor.

### 🟡 MEDIUM PRIORITY
4. **Supabase keep-alive cron job** — Supabase free tier projects pause after inactivity. Without a keep-alive ping, the database will sleep and data pages will fall back to demo data.
   - Set up at https://cron-job.org (free)
   - URL to ping: `https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/`
   - Schedule: every 5 minutes

### 🟢 LOW PRIORITY
5. **Supabase Auth URL configuration** — if not already done in the Supabase dashboard:
   - Project Settings → Auth → URL Configuration
   - Site URL: `https://calniconline.ro`
   - Redirect URLs: `https://calniconline.ro/login.html`
6. **OG image** (`og-image.png`) — verify the open graph image renders correctly on social media shares

---

## 5. SECURITY NOTES

| Finding | Risk | Notes |
|---------|------|-------|
| Supabase `SUPABASE_URL` in `supabase.js` | 🟡 Low | Project URL is public in supabase.js — acceptable for a public site |
| Supabase `SUPABASE_ANON_KEY` in `supabase.js` | 🟡 Low | Anon key is **designed to be public** (see Supabase docs). RLS policies control what data is accessible. Verify RLS is enabled on all tables. |
| Formspree endpoint in `contact.html` | 🟢 Very Low | Client-side form endpoints are always visible; standard practice |
| No service role key exposed | ✅ OK | Only the anon key is present. Never commit the service role key. |
| No HTTP links found | ✅ OK | All external resources and API calls use HTTPS |

---

## 6. PRIORITIZED ACTION ITEMS

### 🔴 Do These Now
1. **Run `setup-photos-storage.sql`** in Supabase SQL Editor (creates the `photos` table)
2. **Create `photos` bucket** in Supabase Storage dashboard (Storage → New bucket → `photos` → Public: YES)
3. **Fix or create `editeaza-familia.html`** — edit button on family pages is currently broken (404)

### 🟡 Do This Soon
4. **Set up cron-job.org keep-alive** → ping `https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/` every 5 min

### 🟢 Optional / Verify
5. **Confirm Supabase Auth redirect URLs** are set to `https://calniconline.ro` in the Supabase dashboard
6. **Test photo upload** end-to-end once `photos` bucket is created
7. **Test contact form** end-to-end to verify Formspree is receiving messages
8. **Remove old briefing files** (`CALNIC_PROJECT_BRIEFING_V10.txt`, `CALNIC_PROJECT_BRIEFING_V11.txt`) if no longer needed

---

## 7. SETUP-PHOTOS-STORAGE.SQL (Full Contents)

```sql
-- setup-photos-storage.sql
-- Creates the photos table, RLS policies, and helper notes for Supabase Storage.
--
-- Run this in the Supabase SQL Editor AFTER running the main setup in README-SUPABASE.md.
--
-- ✅ SAFE TO RE-RUN: the table is created with IF NOT EXISTS, and each policy is
--    wrapped in a DO block that silently skips creation if the policy already exists.

-- IMPORTANT — also do these two steps manually in the Supabase dashboard:
--   1. Storage → New bucket → name: "photos" → Public bucket: YES → Create
--   2. Storage → photos bucket → Policies → Add policy:
--        "Public read"   → Allowed operation: SELECT → Using expression: true
--        "Auth upload"   → Allowed operation: INSERT → Check expression: auth.uid() IS NOT NULL

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

alter table photos enable row level security;

do $$ begin
  create policy "public read photos"
    on photos for select
    using (is_private = false);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "uploader read own private photos"
    on photos for select
    using (auth.uid() = uploader_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "auth insert photos"
    on photos for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "uploader delete own photos"
    on photos for delete
    using (auth.uid() = uploader_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "uploader update own photos"
    on photos for update
    using (auth.uid() = uploader_id);
exception when duplicate_object then null;
end $$;
```
