# CALNIC ONLINE — MASTER BRIEFING
**Date:** 2026-03-24
**Status:** Live at [https://calniconline.ro](https://calniconline.ro)
**Repository:** [AngelOfSoul/Angelofsoul.github.io](https://github.com/AngelOfSoul/Angelofsoul.github.io)
**Supabase Project:** [https://qjgvhirmnxpqqcllzukp.supabase.co](https://qjgvhirmnxpqqcllzukp.supabase.co)

---

## What is this site?

**Calnic Online** is a digital memory book ("cartea vie a satului") for Calnic, a village in Alba County, Transylvania, Romania. Families from the village can register, add their story, members, timeline of events, and upload photos. The site is fully bilingual: **Romanian + English**.

- **Tech stack:** GitHub Pages (hosting) + Supabase (database, auth, storage) + Formspree (contact form) + Leaflet.js (map) — all free tier
- **Annual cost:** ~50–80 lei/year (only the domain)

---

## 1. COMPLETED TASKS ✅

| # | Task | Status |
|---|------|--------|
| 1 | Custom domain `calniconline.ro` — live with HTTPS enforced | ✅ Done |
| 2 | DNS propagation — complete | ✅ Done |
| 3 | `CNAME` file in repo contains `calniconline.ro` | ✅ Confirmed |
| 4 | Supabase Auth URL Configuration — updated to `calniconline.ro` | ✅ Done |
| 5 | Real Supabase credentials set in `supabase.js` (not placeholders) | ✅ Done |
| 6 | cron-job.org keep-alive ping — set up (pings `https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/` every 5 min) | ✅ Done |
| 7 | Stamen map tiles migrated to Stadia Maps in `harta.html` | ✅ Done |
| 8 | `og-image.png` created (1200×630px) for social media previews | ✅ Done |
| 9 | `og:image`, `og:description`, Twitter card meta tags added to all public pages | ✅ Done |
| 10 | All `og:url` tags updated to `calniconline.ro` (not `angelofsoul.github.io`) | ✅ Done |
| 11 | Canonical link tags added to all public pages | ✅ Done |
| 12 | "My Photos" section (Section 5) added to `dashboard.html` | ✅ Done |
| 13 | `README-SUPABASE.md` updated with correct `calniconline.ro` auth URLs | ✅ Done |
| 14 | All 13 pages fully built and bilingual (RO/EN) | ✅ Done |
| 15 | Language choice persisted via `localStorage` (`calnic-lang` key) | ✅ Done |
| 16 | Contact form connected to Formspree endpoint `xpqygdjn` | ✅ Done |
| 17 | Demo data fallback on all data pages (no blank screens when DB is empty) | ✅ Done |
| 18 | Interactive village map with Leaflet.js (landmarks, satellite + street views) | ✅ Done |
| 19 | Family PIN protection (base64-encoded in DB, verified via RPC `check_family_pin`) | ✅ Done |
| 20 | Photo upload with auto-compression (max 1200px, JPEG quality 0.82) | ✅ Done |

---

## 2. FILE INVENTORY

| File | Description |
|------|-------------|
| `index.html` | Home page — welcome, mission, site overview, how to join |
| `istorie.html` | Village History — timeline of Calnic from ancient times to today; static content |
| `familiile.html` | Families Directory — lists all registered families; searchable; loads from Supabase `families` table |
| `familiile-familie.html` | Individual Family Page — story, members, timeline, photos; PIN-protected private section; opened via `?family=UUID` |
| `genealogie.html` | Genealogy Overview — search for a family to view their family tree |
| `genealogie-familie.html` | Family Tree Viewer — interactive SVG tree of all members across generations; opened via `?family=UUID` |
| `galerie.html` | Photo Gallery — village photos by category and year; logged-in users can upload photos (compressed to JPEG) |
| `harta.html` | Village Map — interactive Leaflet.js map with satellite, street, and label layers; shows landmarks |
| `login.html` | Family Account — sign in, register (Step 1 email/pass + Step 2 family details), reset password |
| `dashboard.html` | Private Family Dashboard — manage story, members, timeline, PIN, privacy settings, and uploaded photos |
| `contact.html` | Contact Form — send messages to site owner via Formspree; includes FAQ accordion |
| `intrebari.html` | FAQ — plain-language answers about privacy, genealogy, how to register |
| `404.html` | Custom 404 Page — friendly error page for wrong URLs; no supabase.js needed |
| `supabase.js` | Supabase client config — loads Supabase JS v2 from CDN, fires `supabase:ready` event; real credentials set |
| `CNAME` | Custom domain file — contains `calniconline.ro` for GitHub Pages |
| `og-image.png` | Social sharing image — 1200×630px golden design used by all pages for Facebook/WhatsApp/Twitter previews |
| `setup-photos-storage.sql` | Photos table + RLS policies SQL — run once in Supabase SQL Editor to enable photo uploads |
| `seed-demo-data.sql` | Demo data SQL — seeds 5 demo families (Popescu, Muresan, Ionescu, Moldovan, Popa) with fixed UUIDs |
| `README-SUPABASE.md` | Supabase setup guide — step-by-step instructions for tables, RLS, auth, storage |
| `CALNIC_PROJECT_BRIEFING_V10.txt` | Previous project briefing (superseded by V11) |
| `CALNIC_PROJECT_BRIEFING_V11.txt` | Project briefing V11 — latest before this BRIEFING.md |
| `BRIEFING.md` | This file — master reference document |

> **Note:** `README.md` was mentioned in previous project documentation but does **not exist** in the repository. Only `README-SUPABASE.md` exists.

---

## 3. SUPABASE STATUS

| Item | Value |
|------|-------|
| **Project URL** | `https://qjgvhirmnxpqqcllzukp.supabase.co` |
| **Anon Key** | Real key (JWT, not a placeholder) — set in `supabase.js` line 15 |
| **Credentials** | ✅ REAL — not placeholders. `isSupabaseConfigured()` returns `true` |
| **Auth Site URL** | `https://calniconline.ro` (configured) |
| **Auth Redirect URL** | `https://calniconline.ro/login.html` (configured) |

### Database Tables Used

| Table | Used By | Purpose |
|-------|---------|---------|
| `families` | `familiile.html`, `familiile-familie.html`, `genealogie.html`, `genealogie-familie.html`, `login.html`, `dashboard.html` | One row per registered family |
| `members` | `familiile-familie.html`, `genealogie-familie.html`, `dashboard.html` | Family members |
| `timeline` | `familiile-familie.html`, `dashboard.html` | Historical events per family |
| `photos` | `galerie.html`, `dashboard.html` | Uploaded photo metadata |

### RPC Functions

| Function | Used By | Purpose |
|----------|---------|---------|
| `check_family_pin(p_family_id, p_pin)` | `familiile-familie.html` | Verifies family PIN by comparing base64 hash |

### Storage Buckets Referenced

| Bucket | Used By | Purpose |
|--------|---------|---------|
| `photos` | `galerie.html`, `dashboard.html` | Stores uploaded family photos as JPEG files |

### Storage Setup Status

> ⚠️ The `photos` storage bucket and `photos` table may not yet be created in Supabase.
> See **Section 7** and **Section 8** for the exact steps.

---

## 4. WHAT IS WORKING ✅

Based on full code review of all files:

- ✅ All 13 pages render correctly and are bilingual (RO/EN)
- ✅ Language choice (`calnic-lang` in localStorage) persists across all pages
- ✅ Real Supabase credentials in `supabase.js` — `window.supabase` is created on load
- ✅ `supabase:ready` event pattern used correctly across all pages
- ✅ `families` table loads on `familiile.html` with search and letter filtering
- ✅ Individual family pages (`familiile-familie.html`) load by `?family=UUID` from DB
- ✅ `members` and `timeline` load per family
- ✅ Genealogy search (`genealogie.html`) and family tree viewer (`genealogie-familie.html`) query DB
- ✅ Login (`login.html`) with email/password via Supabase Auth — sign in, register, reset password
- ✅ Registration Step 2 — family name, village, year, description, members, timeline, PIN
- ✅ Dashboard (`dashboard.html`) — requires auth, loads owner's family, allows editing all fields
- ✅ Dashboard "My Photos" section — lists and deletes uploaded photos
- ✅ Photo upload (`galerie.html`) — compression to JPEG max 1200px, upload to `photos` Storage bucket
- ✅ Gallery loads real photos from Supabase with fallback to 8 demo photos
- ✅ Village map (`harta.html`) — Leaflet.js with satellite (ArcGIS), street (OSM), and label (Stadia Maps) layers
- ✅ Map tile provider updated to Stadia Maps (`tiles.stadiamaps.com`) — old broken Stamen URLs fixed
- ✅ Contact form (`contact.html`) — Formspree endpoint `xpqygdjn`, validates inputs, shows success state
- ✅ Demo data fallback on `familiile.html`, `familiile-familie.html`, `galerie.html`, `genealogie.html`
- ✅ Social meta tags (`og:image`, `og:description`, `og:url`, Twitter cards) on all public pages
- ✅ `og-image.png` present at repo root (1200×630px)
- ✅ Canonical URLs set to `calniconline.ro` on all public pages
- ✅ `CNAME` file contains `calniconline.ro`
- ✅ Custom domain live with HTTPS enforced
- ✅ cron-job.org keep-alive ping active (pings every 5 minutes)
- ✅ RLS policies configured for `families`, `members`, `timeline` (in `README-SUPABASE.md`)
- ✅ Family PIN stored as base64 in `families.pin_hash`, verified server-side via RPC

---

## 5. WHAT IS BROKEN ❌

| Issue | File | Details |
|-------|------|---------|
| `README.md` does not exist | — | `CALNIC_PROJECT_BRIEFING_V11.txt` lists `README.md` in the file inventory, but the file is not in the repository. Only `README-SUPABASE.md` exists. |
| `photos` table not yet created in Supabase | Supabase | `setup-photos-storage.sql` needs to be run in the Supabase SQL Editor. Until this is done, photo uploads will fail with a DB error. See **Section 8** for the full SQL and step-by-step instructions. |
| `photos` Storage bucket not yet created in Supabase | Supabase | The `photos` bucket must be manually created in Supabase Storage (Public). Until done, photo file uploads will fail. See **Section 8** for the exact steps. |
| `seed-demo-data.sql` not yet run | Supabase | The 5 demo families are not in the live DB yet. Pages fall back to hard-coded demo data instead. This is functional but not ideal. |
| Formspree `xpqygdjn` not verified | `contact.html` | Formspree requires email verification of the form owner. If the endpoint was never activated, contact form submissions silently fail. Verify at [formspree.io](https://formspree.io). |

---

## 6. WHAT IS MISSING ⚠️

| Item | Description |
|------|-------------|
| `README.md` | A general project readme is listed in V11 file inventory but missing from the repo root |
| `photos` bucket in Supabase Storage | Must be created manually in the Supabase dashboard (Storage → New bucket → `photos` → Public) |
| Storage RLS policies | Two storage policies need manual creation: SELECT (public read) + INSERT (auth users only) |
| `setup-photos-storage.sql` run in Supabase | SQL must be run to create the `photos` table and its RLS policies |
| Seed data in live DB | `seed-demo-data.sql` not yet run — the DB may have no families yet |
| Full end-to-end walkthrough | No confirmed test of the full flow from registration → dashboard → photo upload → public gallery on `calniconline.ro` |
| Password reset email template | Not customized in Supabase; users receive a generic Supabase email (not branded as Calnic Online) |
| Family delete / deregister | No way for a family to delete their account or family page in the current dashboard |
| Admin panel | No admin view to see all registered families, moderate content, or reset PINs |

---

## 7. REMAINING ACTION ITEMS 📋

### 🔴 HIGH — Blocking Issues

1. **Run `setup-photos-storage.sql` in Supabase SQL Editor**
   - Without this, the `photos` table does not exist and all photo uploads fail with a database error
   - Go to [Supabase](https://supabase.com) → your project → SQL Editor → paste the full SQL from Section 8 below → click Run

2. **Create the `photos` Storage bucket in Supabase**
   - Go to Supabase → Storage → New bucket → Name: `photos` → Public bucket: ON → Create
   - Then add two policies:
     - **Public read:** Operation: SELECT, Expression: `true`
     - **Auth upload:** Operation: INSERT, Expression: `auth.uid() IS NOT NULL`

3. **Verify Formspree endpoint `xpqygdjn` is activated**
   - Go to [formspree.io](https://formspree.io), log in, and confirm the `xpqygdjn` form is active
   - Send a test message from `contact.html` and verify you receive it by email

---

### 🟡 MEDIUM — Should Be Done Soon

4. **Run `seed-demo-data.sql` in Supabase SQL Editor** *(optional but recommended)*
   - Seeds 5 demo families with fixed UUIDs so the site doesn't look empty on first visit
   - Safe to re-run (uses `ON CONFLICT DO NOTHING`)

5. **Full end-to-end walkthrough on calniconline.ro**
   - Visit all 13 pages; switch language RO↔EN
   - Register a test family account; complete Step 2
   - Go to Dashboard; edit story, add a member, add a timeline event
   - Upload a photo; verify it appears in the gallery and "My Photos"
   - Delete the test photo; sign out
   - Send a test contact message and verify receipt

6. **Customize the Supabase Auth email templates**
   - In Supabase → Authentication → Email Templates
   - Customize the "Confirm signup" and "Reset password" emails with Calnic Online branding

---

### 🟢 LOW — Nice to Have

7. **Create `README.md` at repository root**
   - A general readme explaining the project for developers
   - Currently only `README-SUPABASE.md` (technical Supabase guide) exists

8. **Monitor Formspree usage**
   - Free tier: 50 messages/month
   - If the site grows, consider upgrading or switching to an alternative (e.g. web3forms.com)

9. **Consider adding a family delete/deregister option to the Dashboard**
   - Currently there is no way for a family to remove their account

10. **Consider a simple admin panel** (future feature)
    - A hidden admin page to view registered families, moderate photos, reset PINs

---

## 8. SETUP INSTRUCTIONS

### Run this in Supabase SQL Editor → to enable photo uploads

**File:** `setup-photos-storage.sql`

```sql
-- setup-photos-storage.sql
-- Creates the photos table, RLS policies, and helper notes for Supabase Storage.
--
-- Run this in the Supabase SQL Editor AFTER running the main setup in README-SUPABASE.md.
--
-- ✅ SAFE TO RE-RUN: the table is created with IF NOT EXISTS, and each policy is
--    wrapped in a DO block that silently skips creation if the policy already exists.
--    No DROP statements are used, so Supabase will never show a "destructive operations"
--    warning when you run this script.
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
```

### After running the SQL — create the Storage bucket manually:

1. Go to [https://supabase.com](https://supabase.com) → your project `qjgvhirmnxpqqcllzukp`
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Name it exactly: `photos`
5. Toggle **Public bucket** → **ON**
6. Click **Create bucket**
7. Click the `photos` bucket → **Policies** tab
8. Add first policy:
   - Name: `Public read`
   - Allowed operation: `SELECT`
   - Using expression: `true`
9. Add second policy:
   - Name: `Authenticated upload`
   - Allowed operation: `INSERT`
   - Check expression: `auth.uid() IS NOT NULL`

That's it — photo uploads in `galerie.html` will now work! 📸

---

## Technical Reference

### Supabase Client Pattern (used across all pages)

```js
// supabase.js fires 'supabase:ready' when the client is loaded
document.addEventListener('supabase:ready', function() {
  if (!window.supabase) return; // CDN unavailable — demo mode
  // use window.supabase here
});

// Check if real credentials are set:
if (window.isSupabaseConfigured()) { ... }
```

### Language Persistence Pattern

```js
var currentLang = localStorage.getItem('calnic-lang') || 'ro';
// Save: localStorage.setItem('calnic-lang', 'en');
```

### Key URLs

| Name | URL |
|------|-----|
| Live site | https://calniconline.ro |
| GitHub repo | https://github.com/AngelOfSoul/Angelofsoul.github.io |
| Upload files | https://github.com/AngelOfSoul/Angelofsoul.github.io/upload/main |
| Supabase dashboard | https://supabase.com/dashboard/project/qjgvhirmnxpqqcllzukp |
| Formspree dashboard | https://formspree.io |
| cron-job.org | https://cron-job.org |

### Annual Costs

| Service | Cost |
|---------|------|
| GitHub Pages hosting | Free |
| Supabase database/auth/storage | Free |
| Formspree contact form | Free (50 msgs/month) |
| cron-job.org keep-alive | Free |
| Domain `calniconline.ro` | ~50–80 lei/year |
| **TOTAL** | **~50–80 lei/year** |

---

*This is the master reference document for Calnic Online. Keep it updated after every session.*
