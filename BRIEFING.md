# CALNIC ONLINE — PROJECT BRIEFING V12

**Last updated:** 2026-03-24  
**Supersedes:** CALNIC_PROJECT_BRIEFING_V11.txt  
**Live site (temp):** https://angelofsoul.github.io  
**Final domain:** https://calniconline.ro

---

## WHAT IS THIS SITE?

Calnic Online is a digital memory book ("cartea vie a satului") for Calnic, a village in Alba County, Transylvania, Romania.

Each family from the village can create their own private page, add family members, a family history, a timeline of important events, and upload photos. The site is fully bilingual: Romanian + English.

- **GitHub repo:** https://github.com/AngelOfSoul/Angelofsoul.github.io
- **Live site:** https://angelofsoul.github.io (temporary URL)
- **Final domain:** https://calniconline.ro (CNAME configured, domain purchase pending)
- **Upload link:** https://github.com/AngelOfSoul/Angelofsoul.github.io/upload/main

---

## COSTS (per year)

| Service | Cost |
|---------|------|
| Hosting (GitHub Pages) | 0 lei — free forever |
| Database (Supabase) | 0 lei — free forever |
| Contact form (Formspree) | 0 lei — 50 messages/month free |
| Keep-alive (cron-job.org) | 0 lei — free forever |
| Domain calniconline.ro | ~50-80 lei/year |
| **TOTAL** | **~50-80 lei/year** |

---

## FILE INVENTORY (V12)

| File | Description |
|------|-------------|
| `index.html` | Homepage — welcome, mission, site overview, how to join |
| `istorie.html` | Village History — timeline from ancient times to today |
| `familiile.html` | Families Directory — lists all registered families, search/filter |
| `familiile-familie.html` | Individual Family Page — public profile with PIN-protected private section |
| `genealogie.html` | Genealogy Overview — search for a family to see their tree |
| `genealogie-familie.html` | Family Tree Viewer — interactive SVG tree with bio editing |
| `galerie.html` | Photo Gallery — village photos; logged-in families can upload |
| `harta.html` | Village Map — interactive Leaflet.js map of Calnic landmarks |
| `login.html` | Family Account — sign in, register, Step 2 profile completion |
| `dashboard.html` | Private Family Dashboard — manage story, members, timeline, PIN, photos |
| `contact.html` | Contact Form — sends messages via Formspree |
| `intrebari.html` | FAQ — plain-language answers about the site |
| `404.html` | Custom 404 error page |
| `supabase.js` | Shared Supabase client (URL + anon key, fires `supabase:ready` event) |
| `og-image.png` | Social sharing image (1200×630px) |
| `seed-demo-data.sql` | Demo family data (5 families) for Supabase SQL Editor |
| `setup-photos-storage.sql` | Photos table + RLS policies (run once in Supabase) |
| `README-SUPABASE.md` | Supabase setup guide |
| `README.md` | General project readme |
| `CNAME` | Custom domain: `calniconline.ro` |
| `BRIEFING.md` | This file — complete project status |
| `CALNIC_PROJECT_BRIEFING_V10.txt` | Previous briefing (superseded) |
| `CALNIC_PROJECT_BRIEFING_V11.txt` | Previous briefing (superseded) |

---

## ✅ CONFIRMED WORKING

### Supabase Integration
- ✅ `supabase.js` has **real credentials** (URL: `https://qjgvhirmnxpqqcllzukp.supabase.co` + real anon JWT key)
- ✅ All pages that use Supabase correctly import `supabase.js`
- ✅ No references to non-existent columns — uses correct `is_private` (not `visibility`)
- ✅ Table names consistent across all files: `families`, `members`, `timeline`, `photos`
- ✅ Storage bucket name consistent: `photos`
- ✅ `isSupabaseConfigured()` helper exported on `window`
- ✅ `supabase:ready` event pattern used consistently across all pages

### Map (harta.html)
- ✅ Uses **Stadia Maps** tiles (Stamen migrated to Stadia Maps in 2023 — already updated)
  - Satellite: `server.arcgisonline.com` (ArcGIS, no API key needed)
  - Street: `{s}.tile.openstreetmap.org` (OSM, no API key needed)
  - Labels overlay: `tiles.stadiamaps.com/tiles/stamen_toner_labels` (Stadia Maps, no API key needed for this tile)
- ✅ Leaflet.js 1.9.4 loaded from CDN
- ✅ Map initializes correctly with demo family pins

### Auth (login.html)
- ✅ Login wired to Supabase `auth.signInWithPassword`
- ✅ Registration wired to Supabase `auth.signUp`
- ✅ Password reset uses `window.location.origin + '/login.html'` (adapts correctly to calniconline.ro)
- ✅ Session checked on page load with `auth.getSession()`
- ✅ "Already logged in" state shown when session exists

### Gallery (galerie.html)
- ✅ Fetches from Supabase storage `photos` bucket
- ✅ Falls back to 8 SVG placeholder demo photos when Supabase empty
- ✅ Upload form present and wired to Supabase storage + `photos` table insert
- ✅ Image compression: JPEG, max 1200px, quality 0.82
- ✅ `is_private` field used correctly (not `visibility`)

### Genealogy Pages
- ✅ `familiile.html` — fetches from `families` table, correct columns
- ✅ `genealogie.html` — fetches from `families` table, correct columns
- ✅ `familiile-familie.html` — fetches `families`, `members`, `timeline` tables
- ✅ `genealogie-familie.html` — fetches `families`, `members` tables
- ✅ All pages fall back to demo data when Supabase returns nothing

### Contact Form (contact.html)
- ✅ Form wired to Formspree endpoint `https://formspree.io/f/xpqygdjn`
- ✅ Sends name, email, subject, family name, village, message
- ✅ Success/error states handled
- ✅ 50 free messages/month

### Setup Files
- ✅ `setup-photos-storage.sql` — creates `photos` table with RLS policies (safe to re-run)
- ✅ `seed-demo-data.sql` — seeds 5 demo families with members and timeline
- ✅ `CNAME` — contains `calniconline.ro` ✓
- ✅ `README-SUPABASE.md` — Supabase setup guide with correct calniconline.ro URLs

### Cross-Page Consistency
- ✅ Language switching (RO/EN) via `localStorage` key `calnic-lang` on all pages
- ✅ Navigation menu identical across all 13 pages (same 8 links + login button)
- ✅ Footer identical across all pages
- ✅ CSS design system consistent (dark theme, gold accents, Playfair Display + EB Garamond fonts)

### Performance & Security
- ✅ No exposed API keys (Supabase anon key is safe to expose by design)
- ✅ No insecure HTTP links (all external resources use HTTPS)
- ✅ `og-image.png` exists (22KB — reasonable size)
- ✅ Social meta tags (og:image, og:description, Twitter cards) on all public pages
- ✅ Canonical URLs all pointing to `calniconline.ro`

---

## ❌ BUGS FIXED IN V12

### contact.html — Duplicate `id` attribute (FIXED)
**File:** `contact.html` line 572  
**Bug:** The message textarea had `id="inp-msg"` duplicated twice on the same element:
```html
<!-- BEFORE (broken) -->
<textarea ... id="inp-msg" ... id="inp-msg" ...>

<!-- AFTER (fixed) -->
<textarea ... id="inp-msg" ...>
```
This was an HTML validation error. Fixed by removing the duplicate attribute.

### dashboard.html — Nav "Home" label inconsistency (FIXED)
**File:** `dashboard.html`  
**Bug:** The Home nav link used `data-en="Home"` while all other pages use `data-en="Homepage"`.  
Fixed to `data-en="Homepage"` for consistency.

---

## ⚠️ MISSING / NOT YET IMPLEMENTED

### README.md
The briefing file inventory references `README.md` but the file does not exist in the repository.  
A basic `README.md` has been created in V12.

---

## 📋 ADMIN ACTION ITEMS (in priority order)

These require manual steps in external dashboards — they cannot be done via code:

### 🔴 HIGH PRIORITY

#### A. Run setup-photos-storage.sql + create photos Storage bucket
**Status:** ❌ TODO — blocks photo uploads  
**Steps:**
1. Go to https://supabase.com → your project → SQL Editor
2. Paste contents of `setup-photos-storage.sql` → Run
3. Go to Storage → New bucket → Name: `photos` → Public bucket: YES → Create
4. Add bucket policies:
   - "Public read": SELECT, `true`
   - "Auth upload": INSERT, `auth.uid() IS NOT NULL`

#### B. Update Supabase Auth URLs to calniconline.ro
**Status:** ❌ TODO — needed when calniconline.ro domain goes live  
**Steps:**
1. Go to Supabase → Authentication → URL Configuration
2. Set Site URL: `https://calniconline.ro`
3. Add Redirect URL: `https://calniconline.ro/login.html`

### 🟡 MEDIUM PRIORITY

#### C. Buy calniconline.ro domain
**Status:** ❌ TODO — ~50-80 lei/year  
The CNAME file already contains `calniconline.ro`. Once the domain is purchased, follow Task D.

#### D. Connect domain via DNS + GitHub Pages
**Steps:**
1. Buy domain from any Romanian registrar (nic.ro, rotld.ro, etc.)
2. Set DNS A records to GitHub Pages IPs:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. Set DNS CNAME: `www` → `angelofsoul.github.io`
4. Wait 24-48 hours for DNS propagation
5. GitHub repo → Settings → Pages → Custom domain: `calniconline.ro` → Save → Enable HTTPS

#### E. Set up cron-job.org keep-alive ping
**Status:** ❌ TODO — prevents Supabase free tier from sleeping  
**Steps:**
1. Go to https://cron-job.org → create free account
2. Create cronjob:
   - URL: `https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/families?limit=1`
   - Header key: `apikey`
   - Header value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ3ZoaXJtbnhwcXFjbGx6dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ2NTgsImV4cCI6MjA4OTg1MDY1OH0.j3SgLKfwYUaY5elT6JIshvohYvr2UigvPHub7Nzm82M`
   - Schedule: every 3 days
3. Save and enable

### 🟢 LOW PRIORITY

#### F. Manual full walkthrough before announcing the site
Do this after domain is live and all tasks above are done:
- [ ] Visit https://calniconline.ro — check home page loads correctly
- [ ] Try switching between RO and EN — check it stays on next page
- [ ] Open Families page — check families load from database
- [ ] Register a test family account on login.html
- [ ] Complete Step 2 (name, year, description, PIN)
- [ ] Go to Dashboard — check all 5 sections work
- [ ] Try uploading a photo on galerie.html
- [ ] Check the photo appears in "My Photos" on dashboard
- [ ] Delete the test photo
- [ ] Try the Contact form — send a test message
- [ ] Share a page link on WhatsApp — check og:image preview appears
- [ ] Check the site on mobile phone (responsive design)

---

## TECHNICAL DETAILS

### Backend Stack
| Component | Details |
|-----------|---------|
| Database/Auth/Storage | Supabase (https://supabase.com) |
| Supabase URL | `https://qjgvhirmnxpqqcllzukp.supabase.co` |
| Supabase client | `supabase.js` (shared, imported by all pages that need it) |
| Client event | `supabase:ready` fires when client is loaded |
| Client reference | `window.supabase` |
| Config check | `window.isSupabaseConfigured()` → boolean |

### Database Tables

**`families`**
```
id, owner_id, name, village, since, desc_ro, desc_en,
members_count, generations_count, photos_count,
show_members, show_generations, show_photos, show_since,
has_public_photos, has_private_photos, pin_hash, created_at
```

**`members`**
```
id, family_id, name, initial, role, birth_year, death_year, is_deceased
```

**`timeline`**
```
id, family_id, year, text_ro, text_en
```

**`photos`**
```
id, family_id, uploader_id, path, title_ro, title_en,
caption_ro, caption_en, dedicatie_ro, dedicatie_en,
year, category, is_private, uploaded_at
```

### Supabase Storage
- **Bucket name:** `photos`
- **Access:** PUBLIC (read without auth)
- **Upload path:** `{userId}/{timestamp}.jpg`

### Helper RPC Function
```sql
check_family_pin(p_family_id uuid, p_pin text) → boolean
```
Compares `encode64(p_pin)` against stored `pin_hash` in families table.

### Auth Setup
- Provider: Email (email + password)
- Site URL: `https://calniconline.ro`
- Redirect URL: `https://calniconline.ro/login.html`
- PIN storage: `btoa(pin)` — base64 encoded

### Language Persistence
- Storage key: `localStorage` → `calnic-lang`
- Values: `ro` (default) or `en`
- Pattern: `var currentLang = localStorage.getItem('calnic-lang') || 'ro';`

### Contact Form
- Provider: Formspree
- Endpoint: `https://formspree.io/f/xpqygdjn`

### Photo Upload
- Compression: JPEG, max 1200px width/height, quality 0.82
- Storage path: `{userId}/{timestamp}.jpg` in `photos` bucket

### Demo Data (fallback when database is empty)
| Page | Demo Data |
|------|-----------|
| `familiile.html` | 5 demo families (Popescu, Muresan, Ionescu, Moldovan, Popa) |
| `genealogie.html` | Same 5 demo families |
| `familiile-familie.html` | Demo Popescu family with members + timeline |
| `galerie.html` | 8 demo photos with SVG placeholder images |
| All demo data is replaced automatically when real data loads from Supabase. |

### SEO / Social Sharing
- `og-image.png`: 1200×630px social card
- `og:image` URL: `https://calniconline.ro/og-image.png`
- Canonical URLs: all pages use `https://calniconline.ro/[page].html`
- Twitter cards: `summary_large_image` on all public pages

---

## CRITICAL RULES (for every future Copilot session)

- Always use `calnic-lang` as the localStorage key (never `lang`)
- Always use `https://calniconline.ro` as base URL (not `angelofsoul.github.io`)
- Always communicate in English
- Fix ALL affected pages when something changes
- Before context limit: create updated briefing + changelog
- Always give upload link after delivering any file
- Treat site as fully live — no "coming soon" framing
- Supabase anon key is safe to expose in client-side code (by Supabase design)

---

## BUILD STATUS HISTORY

| Version | Changes |
|---------|---------|
| V1–V8 | Initial pages built (index, histoire, familii, galerie, etc.) |
| V9 | All 13 pages completed, language persistence on all pages |
| V10 | Supabase wiring, galerie.html Storage upload, photos table, login.html + dashboard.html, genealogie/genealogie-familie Supabase wiring |
| V11 | og-image.png created, og:image + og:description + Twitter cards + canonical URLs on all pages, "My Photos" in dashboard, og:url updated to calniconline.ro, README-SUPABASE.md updated |
| V12 | Deep audit completed; fixed duplicate `id` in contact.html; fixed nav label inconsistency in dashboard.html; created BRIEFING.md (this file) and README.md |

---

*End of BRIEFING V12 — 2026-03-24*
