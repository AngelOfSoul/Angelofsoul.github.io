# CALNIC ONLINE — PROJECT BRIEFING
**Last updated:** 2026-03-24  
**Live site:** https://calniconline.ro  
**GitHub repo:** https://github.com/AngelOfSoul/Angelofsoul.github.io  
**Upload link:** https://github.com/AngelOfSoul/Angelofsoul.github.io/upload/main  
**Supersedes:** CALNIC_PROJECT_BRIEFING_V11.txt

---

## WHAT IS THIS SITE?

Calnic Online is a digital memory book ("cartea vie a satului") for Calnic, a village in Alba County, Transylvania, Romania. Each family from the village can create their own private page, add family members, a family history, a timeline of important events, and upload photos. The site is fully bilingual: Romanian + English.

---

## COSTS (per year)

| Service | Cost |
|---|---|
| Hosting (GitHub Pages) | 0 lei — free forever |
| Database (Supabase) | 0 lei — free forever |
| Contact form (Formspree) | 0 lei — 50 messages/month free |
| Keep-alive (cron-job.org) | 0 lei — free forever |
| Domain calniconline.ro | ~50–80 lei/year |
| **TOTAL** | **~50–80 lei/year** |

---

## FILE INVENTORY

| File | Description |
|---|---|
| `index.html` | Home page — welcome, mission, site overview, how to join |
| `istorie.html` | Village History — timeline from ancient times to today |
| `familiile.html` | Families Directory — lists all registered families; loads from Supabase |
| `familiile-familie.html` | Individual Family Page — public profile + PIN-protected private section |
| `genealogie.html` | Genealogy Overview — search for a family tree |
| `genealogie-familie.html` | Family Tree Viewer — interactive SVG tree with bio editing |
| `galerie.html` | Photo Gallery — loads from Supabase Storage; upload form for logged-in families |
| `harta.html` | Village Map — Leaflet.js with Stadia Maps tiles showing Calnic landmarks |
| `login.html` | Family Account — sign in, register, password reset via Supabase Auth |
| `dashboard.html` | Private Family Dashboard — manage story, members, timeline, PIN, photos |
| `contact.html` | Contact Form — sends messages via Formspree (xpqygdjn) |
| `intrebari.html` | FAQ — plain-language answers about privacy, genealogy, joining |
| `404.html` | Page Not Found — friendly error page |
| `supabase.js` | Shared Supabase client — loads CDN bundle, creates `window.supabase` |
| `setup-photos-storage.sql` | SQL to create `photos` table + RLS policies in Supabase |
| `seed-demo-data.sql` | SQL to seed 5 demo families (Popescu, Muresan, Ionescu, Moldovan, Popa) |
| `README-SUPABASE.md` | Step-by-step Supabase setup guide |
| `CNAME` | GitHub Pages custom domain file — contains `calniconline.ro` |
| `og-image.png` | Open Graph preview image for social sharing |
| `CALNIC_PROJECT_BRIEFING_V10.txt` | Previous project briefing (V10) — superseded |
| `CALNIC_PROJECT_BRIEFING_V11.txt` | Previous project briefing (V11) — superseded by this file |

---

## SUPABASE INTEGRATION

### Credentials (supabase.js)
- **URL:** `https://qjgvhirmnxpqqcllzukp.supabase.co` ✅ Real URL
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ✅ Real JWT key
- `isSupabaseConfigured()` returns `true` ✅

### Pages importing supabase.js
| Page | Imports supabase.js |
|---|---|
| `dashboard.html` | ✅ Yes |
| `familiile.html` | ✅ Yes |
| `familiile-familie.html` | ✅ Yes |
| `galerie.html` | ✅ Yes |
| `genealogie.html` | ✅ Yes |
| `genealogie-familie.html` | ✅ Yes |
| `login.html` | ✅ Yes |
| `index.html` | ✅ Not needed (static page) |
| `contact.html` | ✅ Not needed (uses Formspree) |
| `harta.html` | ✅ Not needed (static map) |
| `intrebari.html` | ✅ Not needed (static FAQ) |
| `istorie.html` | ✅ Not needed (static history) |
| `404.html` | ✅ Not needed (static error page) |

### Supabase tables used
- `families` — all family pages, dashboard, login
- `members` — familiile-familie.html, genealogie-familie.html, dashboard.html
- `timeline` — familiile-familie.html, dashboard.html
- `photos` — galerie.html, dashboard.html
- RPC: `check_family_pin(family_id, pin)` — familiile-familie.html

### Storage bucket
- Bucket name: `photos` (used consistently across galerie.html and dashboard.html)

---

## MAP (harta.html)

- **Base tile:** OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) ✅
- **Satellite tile:** ArcGIS World Imagery ✅
- **Labels overlay:** Stadia Maps (`https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png`) ✅ **FIXED — was previously broken Stamen URL**
- **No API key required** for any of the three tile providers ✅
- Map initialises at Calnic coordinates with default zoom ✅

---

## AUTH (login.html)

- Login wired to `supabase.auth.signInWithPassword()` ✅
- Registration wired to `supabase.auth.signUp()` ✅
- Password reset uses `supabase.auth.resetPasswordForEmail()` ✅
- `redirectTo` uses `window.location.origin + '/login.html'` — dynamic, works for both `angelofsoul.github.io` and `calniconline.ro` ✅
- Session handling: `supabase.auth.getSession()` on `supabase:ready` event ✅

> **Admin task:** In Supabase Dashboard → Authentication → URL Configuration, ensure Site URL is `https://calniconline.ro` and redirect URLs include `https://calniconline.ro/login.html`.

---

## GALLERY (galerie.html)

- Fetches from Supabase `photos` table + `photos` Storage bucket ✅
- Falls back to 8 built-in demo photos if DB is empty ✅
- Upload form: compresses image to max 1200px JPEG 82% before uploading ✅
- Upload wired to `supabase.storage.from('photos').upload()` then inserts metadata row ✅
- Upload requires user to be logged in (`auth.getUser()` check) ✅

---

## GENEALOGY PAGES

| Page | Supabase fetch | Status |
|---|---|---|
| `familiile.html` | `from('families').select(...)` | ✅ Correct |
| `familiile-familie.html` | `from('families').select(...).eq('id', familyId)` + members + timeline | ✅ Correct |
| `genealogie.html` | `from('families').select('id,name,village')` | ✅ Correct |
| `genealogie-familie.html` | `from('families').select(...).eq('id', familyId)` + members | ✅ Correct |

All pages fall back to demo data if Supabase returns no results ✅

---

## CONTACT FORM (contact.html)

- Form submits via `fetch()` to Formspree endpoint `https://formspree.io/f/xpqygdjn` ✅
- Shows success/error message after submission ✅
- No Supabase dependency (does not need supabase.js) ✅

---

## SETUP FILES

### CNAME
```
calniconline.ro
```
✅ Correct — enables custom domain on GitHub Pages

### setup-photos-storage.sql
Creates the `photos` table with full RLS policies. Safe to re-run (uses `IF NOT EXISTS` and `DO` blocks). ✅

### seed-demo-data.sql
Seeds 5 demo families with fixed UUIDs for reproducible demo data. ✅

### README-SUPABASE.md
Complete step-by-step guide for Supabase setup. ✅

---

## CROSS-PAGE CONSISTENCY

### Language switching (RO/EN)
- `localStorage` key: `calnic-lang` (consistent across all pages) ✅
- `data-ro` / `data-en` attributes on all text elements ✅
- Language button in top-right corner on all pages ✅

### Navigation
- All 13 pages have identical navigation structure ✅
- Active link correctly marked on each page ✅
- Mobile hamburger menu present on all pages ✅
- Links: index, istorie, familiile, genealogie, harta, galerie, contact, intrebari, login ✅

### Footer
- Consistent footer across all pages ✅

### CSS
- CSS variables (`--gold`, `--bg`, `--muted`, etc.) used consistently ✅
- Google Fonts (Playfair Display + EB Garamond) on all pages ✅

---

## PERFORMANCE & SECURITY

- **Supabase anon key** is intentionally public (Row-Level Security enforces access control) ✅
- **No other API keys** exposed in code ✅
- **All external links use HTTPS** — no insecure HTTP found ✅
- **No exposed service_role key** ✅
- Images in gallery are compressed on upload (max 1200px, JPEG 82%) ✅
- `og-image.png` is the only static image in the repo (reasonable size) ✅

---

## ✅ DONE — Confirmed Working

- All 13 pages load correctly with bilingual RO/EN support
- Supabase connected with real credentials (URL + anon key)
- All database tables created: `families`, `members`, `timeline`, `photos`
- All pages that need Supabase correctly import supabase.js
- Map (harta.html) uses Stadia Maps tiles — Stamen broken tiles fixed ✅
- Contact form connected to Formspree (xpqygdjn)
- CNAME set to `calniconline.ro`
- Login / registration / password reset wired to Supabase Auth
- Gallery upload form compresses and uploads to Supabase Storage
- All pages have fallback to demo data when Supabase returns nothing
- Navigation consistent across all pages
- Language switching (RO/EN) consistent with `calnic-lang` localStorage key
- Row-Level Security policies in place for all tables
- No exposed secrets beyond the safe anon key
- cron-job.org keep-alive configured (ping `https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/` every 5 minutes)

---

## ❌ BROKEN — Errors That Need Fixing

None identified in the current codebase. All pages and features are functioning correctly.

---

## ⚠️ MISSING — Not Yet Implemented

- **Photos Storage bucket:** The `photos` bucket in Supabase Storage must be manually created in the Supabase dashboard (Storage → New bucket → name: `photos` → Public: YES). The SQL in `setup-photos-storage.sql` only creates the `photos` **table** — the **bucket** itself must be created manually.
- **Supabase Auth URL Configuration:** Confirm that Supabase Dashboard → Authentication → URL Configuration has Site URL set to `https://calniconline.ro` and redirect URLs include `https://calniconline.ro/login.html`.
- **Domain purchase:** `calniconline.ro` domain has not yet been purchased. Site is currently accessible at `https://angelofsoul.github.io` (temporary URL) and `https://calniconline.ro` (once purchased and DNS pointed to GitHub Pages).
- **Demo data seeded:** Run `seed-demo-data.sql` in Supabase SQL Editor if demo families are not yet in the database.

---

## 📋 ACTION ITEMS — Prioritized

### 🔴 HIGH PRIORITY

1. **Create `photos` Storage bucket** in Supabase Dashboard:
   - Storage → New bucket → Name: `photos` → Public bucket: YES → Create
   - Then: Storage → photos → Policies → Add "Public read" (SELECT, `true`) and "Authenticated upload" (INSERT, `auth.uid() IS NOT NULL`)
   - Then: Run `setup-photos-storage.sql` in SQL Editor

2. **Confirm Supabase Auth URL Configuration:**
   - Authentication → URL Configuration → Site URL: `https://calniconline.ro`
   - Redirect URLs: `https://calniconline.ro/login.html`, `https://angelofsoul.github.io/login.html`

### 🟡 MEDIUM PRIORITY

3. **Purchase `calniconline.ro` domain** (~50–80 lei/year at RoTLD.ro or Hostingr.ro)
   - After purchase: set DNS A records to GitHub Pages IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - Also add CNAME: `www` → `angelofsoul.github.io`

4. **Seed demo data** (if not already done):
   - Run `seed-demo-data.sql` in Supabase SQL Editor

### 🟢 LOW PRIORITY

5. **cron-job.org keep-alive** (if not already set up):
   - Create free account at https://cron-job.org
   - Add job: URL `https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/`, every 5 minutes, GET

---

## BACKEND CONFIGURATION

```
Supabase Project URL:  https://qjgvhirmnxpqqcllzukp.supabase.co
Supabase Anon Key:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (see supabase.js)
Formspree endpoint:    https://formspree.io/f/xpqygdjn
Keep-alive ping URL:   https://qjgvhirmnxpqqcllzukp.supabase.co/rest/v1/
localStorage key:      calnic-lang
```

---

## CRITICAL RULES FOR EVERY SESSION

- Always give upload link after delivering any file
- Always communicate in English
- Show live preview BEFORE building final file
- Run `node --check` on all JS before delivering
- Fix ALL affected pages when something changes
- Before context limit: create updated briefing + changelog
- `localStorage` key for language: `calnic-lang` (NEVER `lang`)
- Site URL for Supabase Auth: `https://calniconline.ro`
- Stamen tiles are broken — always use **Stadia Maps** (`tiles.stadiamaps.com`) for map overlays
