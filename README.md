# Calnic Online

**Cartea vie a satului Calnic** — The living book of Calnic village, Alba County, Transylvania, Romania.

🌐 **Live site:** https://calniconline.ro  
📂 **GitHub:** https://github.com/AngelOfSoul/Angelofsoul.github.io

---

## About

Calnic Online is a bilingual (Romanian + English) digital memory book for Calnic village.
Each family can register their own page, add family members, a history, a timeline of important events, and upload photos.

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `index.html` | Welcome and site overview |
| Village History | `istorie.html` | Historical timeline of Calnic |
| Families | `familiile.html` | Directory of all registered families |
| Family Profile | `familiile-familie.html?family=ID` | Individual family public page |
| Genealogy | `genealogie.html` | Search families for their family tree |
| Family Tree | `genealogie-familie.html?family=ID` | Interactive SVG family tree |
| Gallery | `galerie.html` | Village photo gallery (upload for registered families) |
| Map | `harta.html` | Interactive Leaflet.js map of Calnic |
| Login | `login.html` | Family account (sign in / register) |
| Dashboard | `dashboard.html` | Private family dashboard (logged-in only) |
| Contact | `contact.html` | Contact form (Formspree) |
| FAQ | `intrebari.html` | Frequently asked questions |
| 404 | `404.html` | Custom error page |

---

## Setup

### Supabase Database

See [`README-SUPABASE.md`](README-SUPABASE.md) for full setup instructions.

**Quick start:**
1. Create a project at https://supabase.com
2. Run the SQL from `README-SUPABASE.md` to create tables
3. Run `setup-photos-storage.sql` to create the photos table and storage policies
4. (Optional) Run `seed-demo-data.sql` to add demo family data
5. The credentials in `supabase.js` are already configured

### Custom Domain

The `CNAME` file is set to `calniconline.ro`. To activate:
1. Purchase the `calniconline.ro` domain
2. Point DNS A records to GitHub Pages IPs (185.199.108-111.153)
3. Enable custom domain in GitHub repo Settings → Pages

---

## Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (no build step required)
- **Hosting:** GitHub Pages (free)
- **Backend:** Supabase (PostgreSQL + Auth + Storage — free tier)
- **Contact form:** Formspree (free tier — 50 messages/month)
- **Map:** Leaflet.js + OpenStreetMap + Stadia Maps tiles
- **Fonts:** Google Fonts (Playfair Display + EB Garamond)

---

## Project Status

See [`BRIEFING.md`](BRIEFING.md) for the complete audit, bug fixes, and remaining admin tasks.

---

*Calnic Online — built with ❤️ for Calnic village*
