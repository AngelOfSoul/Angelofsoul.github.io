# Calnic Online — Digital Village Memory Book

**Live site:** [https://calniconline.ro](https://calniconline.ro)  
**GitHub:** [https://github.com/AngelOfSoul/Angelofsoul.github.io](https://github.com/AngelOfSoul/Angelofsoul.github.io)

A bilingual (Romanian / English) static website for the village of Călnic, Alba County, Transylvania. Every family in the village can have a public profile and a private space. Goal: preserve memories, genealogy and photos for future generations — free forever, no ads.

---

## ✅ What's already built

### Phase 1 — All pages complete
| Page | Description |
|------|-------------|
| `index.html` | Homepage |
| `istorie.html` | Village history |
| `familiile.html` | Family directory with search & filter |
| `galerie.html` | Photo gallery |
| `genealogie.html` | Genealogy browser |
| `genealogie-familie.html` | Family tree detail |
| `harta.html` | Interactive map |
| `contact.html` | Contact page |
| `familiile-familie.html` | Individual family profile |
| `intrebari.html` | FAQ |

### Phase 2 — Supabase backend (code complete, needs configuration)
| File | Description |
|------|-------------|
| `supabase.js` | Shared Supabase client — **needs your keys** |
| `login.html` | Family login & registration |
| `README-SUPABASE.md` | Detailed Supabase setup guide |
| `seed-demo-data.sql` | SQL to seed the 5 demo families |

---

## 🚀 What to do right now — Step by step

### Step 1 — Merge the Phase 2 pull request

1. Go to [https://github.com/AngelOfSoul/Angelofsoul.github.io/pulls](https://github.com/AngelOfSoul/Angelofsoul.github.io/pulls)
2. Open the pull request named **"Phase 2 — Supabase backend, family authentication & PIN system"**
3. Click **Merge pull request** → **Confirm merge**
4. Your live site at [https://calniconline.ro](https://calniconline.ro) will update automatically within ~2 minutes

> After merging, the site works exactly as before (all pages show demo data). The login button now points to `login.html` but registration won't work until Step 2.

---

### Step 2 — Create your free Supabase account

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (free, no credit card)
2. Sign up with GitHub or email
3. Click **New project**, name it `calnic-online`, choose **West EU (Ireland)** region
4. Wait ~2 minutes for the project to be created
5. Go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (long text starting with `eyJ...`)

---

### Step 3 — Add your Supabase keys to the site

1. Go to [https://github.com/AngelOfSoul/Angelofsoul.github.io/blob/main/supabase.js](https://github.com/AngelOfSoul/Angelofsoul.github.io/blob/main/supabase.js)
2. Click the **pencil icon** (Edit this file)
3. Replace line 14:
   ```js
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   ```
   with your actual Project URL, e.g.:
   ```js
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   ```
4. Replace line 15:
   ```js
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   with your actual anon key
5. Scroll down and click **Commit changes**

---

### Step 4 — Create the database tables

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `README-SUPABASE.md` in this repo and copy the SQL from **Section 3** (Create database tables)
4. Paste it into the SQL Editor and click **Run**
5. Run the SQL from **Section 4** (Row-Level Security) in a second query

---

### Step 5 — Configure authentication

1. In Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to `https://calniconline.ro`
3. Add **Redirect URL**: `https://calniconline.ro/login.html`
4. Save

---

### Step 6 — Seed the demo families (optional)

If you want the 5 demo families (Popescu, Muresan, Ionescu, Moldovan, Popa) to appear in the live database:

1. Open `seed-demo-data.sql` in the Supabase SQL Editor
2. Run it

After this, `familiile.html` will load real data from the database instead of the built-in demo.

---

### Step 7 — Test it

1. Visit [https://calniconline.ro/login.html](https://calniconline.ro/login.html)
2. Click **Înregistrează familia** (Register family)
3. Fill in the form and register
4. Check your email for a confirmation link, click it
5. Log in — you should be redirected to `familiile.html`
6. Your family should appear in the list!

---

## 📋 Remaining roadmap

### Phase 1 remaining
| Page | Status |
|------|--------|
| `evenimente.html` | ⬜ Village Events Calendar — next to build |

### Phase 3 — Keep-alive (after Supabase is working)
- Set up a free ping at [cron-job.org](https://cron-job.org) to keep the Supabase free tier active
- Add a cron job to `GET https://<your-project>.supabase.co/rest/v1/families?limit=1` every 3 days

### Phase 4 — Domain (already have calniconline.ro)
- The CNAME file already points to `calniconline.ro`
- In your domain registrar (wherever you bought the domain), add these DNS records:
  ```
  A     @    185.199.108.153
  A     @    185.199.109.153
  A     @    185.199.110.153
  A     @    185.199.111.153
  CNAME www  angelofsoul.github.io
  ```
- In GitHub → repo Settings → Pages → Custom domain → enter `calniconline.ro` → Save
- Wait 24–48 hours for DNS to propagate

---

## 🛠 How the tech works

- **Platform:** GitHub Pages — free static hosting, deploys on every push to `main`
- **Database:** Supabase (free tier, PostgreSQL) — handles families, members, timeline, photos
- **Auth:** Supabase Auth — email + password, no third-party trackers
- **No build step** — pure HTML + CSS + vanilla JS, works in any browser
- **Bilingual** — every text element has `data-ro` / `data-en` attributes, toggled by a JS function

---

## 📁 File structure

```
/
├── index.html                  Homepage
├── istorie.html                Village history
├── familiile.html              Family directory
├── familiile-familie.html      Individual family profile
├── genealogie.html             Genealogy browser
├── genealogie-familie.html     Family tree detail
├── harta.html                  Interactive map
├── galerie.html                Photo gallery
├── contact.html                Contact
├── intrebari.html              FAQ
├── login.html                  Family login / registration   ← NEW
├── supabase.js                 Supabase client               ← NEW (needs keys)
├── README-SUPABASE.md          Supabase detailed setup guide ← NEW
├── seed-demo-data.sql          SQL seed for demo families    ← NEW
└── CNAME                       Custom domain config
```

---

*Calnic · Alba · Romania · Sat cu suflet, memorie vie*
