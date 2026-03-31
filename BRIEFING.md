# Calnic Online — Briefing Refactorizare & Debug
**Data:** 31 martie 2026

---

## Contextul proiectului

**Calnic Online** este un site static de genealogie pentru satul Călnic, Alba, România.
Stack: HTML + CSS + JavaScript pur (fără framework), Supabase ca backend, GitHub Pages pentru hosting.

---

## Ce s-a construit de la zero în această sesiune

### Step 1 — utils.js (funcții comune)

**Fișier creat:** `js/utils.js`

Extras funcții duplicate din toate paginile într-un singur loc:

| Funcție | Ce face |
|---------|---------|
| `setLang(lang)` | Schimbă limba RO/EN și actualizează toate elementele `[data-ro]` |
| `t(ro, en)` | Returnează textul în limba curentă |
| `lang()` | Returnează limba curentă (`'ro'` sau `'en'`) |
| `escH(s)` | Escape HTML — previne XSS |
| `parseYear(v)` | Parsează un an din string (acceptă `~1920`, spații etc.) |
| `formatYear(year)` | Formatează un an pentru afișare (`—` dacă null) |
| `showMsg(id, text, type)` | Afișează mesaj inline în formular |
| `showToast(text, type)` | Toast global (creat dinamic dacă nu există) |
| `showErr(containerId, title, detail)` | Afișează eroare cu link înapoi |
| `initHamburger()` | Inițializează butonul hamburger pentru meniul mobil |
| `initScrollBtns()` | Inițializează butoanele scroll sus/jos |
| `getParam(name)` | Returnează valoarea unui parametru din URL |
| `getSession()` | Returnează sesiunea Supabase curentă (async) |
| `onSupabaseReady(fn)` | Rulează o funcție după ce Supabase e gata |

Exportate și ca globale (`window.escH`, `window.parseYear` etc.) pentru compatibilitate cu codul existent.

Linkat în toate cele **13 fișiere HTML**.

---

### Step 2 — style.css (CSS comun)

**Fișier creat:** `css/style.css` (~350 linii, 22 secțiuni)

| Secțiune | Conținut |
|----------|----------|
| 1. Variabile CSS | `--bg`, `--gold`, `--text`, `--red`, `--green` etc. |
| 2. Reset & bază | `*, body, a, img, button` |
| 3. Layout | `.container`, `.main-wrap` |
| 4. Bara de limbă | `.lang-bar`, `.lang-label`, `.lang-btn` |
| 5. Header | `.site-header`, `.banner-img`, `.header-divider` |
| 6. Navigație desktop | `nav`, `.nav-link`, `.nav-right`, `.nav-login` |
| 7. Navigație mobil | `.hamburger`, `.nav-mobile-menu`, `.nav-mobile-link` |
| 8. Scroll sus/jos | `.scroll-top`, `.scroll-bottom` |
| 9. Footer | `footer`, `footer .g` |
| 10. Antet secțiune | `.section-head`, `.section-head-title` |
| 11. Butoane | `.btn`, `.btn-secondary`, `.btn-danger`, `.tree-btn` |
| 12. Formulare | `.fi-wrap`, `.fi-input`, `.fi-select`, `.fi-textarea` |
| 13. Carduri | `.card` |
| 14. Modal & overlay | `.modal-overlay`, `.modal-box`, `.modal-acts` |
| 15. Mesaje / Toast | `.m-msg`, `.form-msg`, `.undo-toast`, `.conflict-banner` |
| 16. Loading / Empty | `.calnic-spinner`, `.calnic-loading`, `.calnic-empty` |
| 17. Tooltip | `.tip-wrap`, `.tip-wrap .tip` |
| 18. Visibility badges | `.vis-toggle`, `.vt-opt` |
| 19. Tipografie | `h1-h4`, `.page-hero`, `.page-hero-title` |
| 20. Utilitare | `.g`, `.muted`, `.text-center`, `.tree-hint` |
| 21. Animații | `@keyframes calnic-spin`, `fadeIn` |
| 22. Responsive | `@media (max-width: 740px)` și `(max-width: 480px)` |

**Fix important rezolvat:** Clasa `.nl` (nav text labels) era setată `display:none` global — dispăruseră textele din meniu. Mutată exclusiv în `@media (max-width: 740px)`.

Linkat în toate cele **13 fișiere HTML**.

---

### Step 3 — Curățare genealogie-familie.html

**Fișier modificat:** `genealogie-familie.html` (1642 → 1546 linii)

**CSS inline:** Redus de la **24.480 caractere → 14.731 caractere** (~40% mai mic).
- Eliminat tot CSS-ul duplicat față de `style.css` (reset, variabile, nav, header, footer, modals, forms etc.)
- Păstrat doar CSS-ul specific paginii (tree stage, person nodes, detail panel, minimap, guide overlay etc.)
- Fix `.pn .nl { display: block !important; }` în media query mobil — labelele nodurilor din arbore nu se mai ascund

**Funcții JS eliminate (duplicate față de utils.js):**
- `escH()` → global din utils.js
- `parseYear()` → global din utils.js

**Funcții păstrate** (semnătură diferită față de utils.js):
- `lang()`, `t()` — nu sunt exportate ca globale din utils.js
- `showMsg()` — ordine argumente diferită (`id, type, text` vs `id, text, type`)

---

### Step 4 — RLS (Row Level Security) Supabase

**Fișier creat:** `sql/rls-fix.sql`

Politici adăugate/corectate:

| Tabel | Operație | Politică |
|-------|----------|----------|
| `families` | SELECT | Public — oricine poate citi |
| `families` | INSERT | Doar `owner_id = auth.uid()` |
| `families` | UPDATE | Doar `owner_id = auth.uid()` |
| `families` | DELETE | Doar `owner_id = auth.uid()` |
| `members` | INSERT | Proprietarul familiei |
| `members` | UPDATE | Proprietarul familiei |
| `members` | DELETE | Proprietarul familiei |
| `timeline` | SELECT | Public |
| `timeline` | ALL | Proprietarul familiei |

Scriptul este **safe to re-run** — fără `DROP`, toate politicile în blocuri `DO` cu excepție la duplicate.

**Verificat în Supabase** — rezultat confirmat de utilizator: ~18 politici active pe tabelele `families`, `members`, `timeline`.

---

### Step 5 — Admin Panel & tabele lipsă

**Fișier creat:** `sql/admin-setup.sql`

Tabele create cu RLS complet:

| Tabel | Conținut | RLS |
|-------|----------|-----|
| `profiles` | Leagă `auth.users` cu `is_admin` | Admin read-all, self read own |
| `admin_logs` | Acțiuni admin (access, publish, delete etc.) | Admin read, auth insert |
| `site_settings` | Setări site (`maintenance`, etc.) — key/value | Public read, admin write |
| `announcements` | Anunțuri cu titlu, tip, dată publicare, expirare | Public read (neexpirate), admin manage all |
| `contact_messages` | Mesaje din formularul de contact | Public insert, admin manage |
| `timeline` | Evenimente istorice familie (year, text_ro, text_en) | Public read, owner write |

**Trigger automat:** La înregistrare (`auth.users` insert), se creează automat un rând în `profiles`.

**Fix CSS în admin.html:** `css/style.css` era încărcat DUPĂ `<style>` — variabilele custom ale admin-ului (`--bg: #060608`) erau suprascrise de variabilele din style.css (`--bg: #0a0a0a`). Mutat înainte de `<style>`.

---

## Debug — Probleme găsite și rezolvate

### Problemă 1 — css/style.css încărcat în ordine greșită (CRITIC)
**Afecta:** 11 din 13 fișiere HTML
**Simptom:** `css/style.css` era încărcat DUPĂ blocul `<style>` al paginii, deci variabilele și stilurile din style.css suprascrieau stilurile locale ale fiecărei pagini.
**Fix:** Mutat `<link rel="stylesheet" href="css/style.css">` înainte de `<style>` în toate fișierele afectate.

Fișiere fixate:
- `dashboard.html` — link era la L245, style la L13
- `familiile.html` — link era la L270, style la L25
- `genealogie.html` — link era la L166, style la L24
- `galerie.html` — link era la L340, style la L25
- `familiile-familie.html` — link era la L292, style la L24
- `istorie.html` — link era la L237, style la L25
- `login.html` — link era la L444, style la L15
- `contact.html` — link era la L450, style la L25
- `intrebari.html` — link era la L218, style la L24
- `404.html` — link era la L59, style la L9
- `index.html` — link era la L416, style la L29

---

### Problemă 2 — admin-nav.js lipsă din 3 pagini
**Afecta:** `istorie.html`, `contact.html`, `intrebari.html`
**Simptom:** Aceste pagini aveau navbar cu `.nav-right` (buton profil, admin link, toggle limbă) dar nu încărcau `js/admin-nav.js` — butonul de profil nu apărea, utilizatorul logat nu vedea nimic.
**Fix:** Adăugat `<script src="js/admin-nav.js"></script>` în toate 3 fișierele.

---

### Problemă 3 — Funcție `relLabel` definită de două ori
**Afecta:** `genealogie-familie.html`
**Simptom:** Funcția `relLabel` era definită la L765 (3 argumente — versiunea corectă, cu logică direcțională) și din nou la L1017 (2 argumente — versiune simplificată). A doua definiție o suprascria pe prima, deci etichetele relațiilor din arborele genealogic afișau texte greșite.

```js
// Definiția CORECTĂ (L765) — păstrată
function relLabel(relType, fromId, toId) { ... }

// Definiția DUPLICATĂ (L1017) — eliminată
function relLabel(tp, bio) { ... }
```

**Fix:** Eliminată a doua definiție (L1017-L1020).

---

## Starea finală a proiectului

```
RESTART/
├── css/
│   └── style.css           ← CSS comun, 22 secțiuni, ~350 linii
├── js/
│   ├── config.js            ← Credențiale Supabase (din .env)
│   ├── supabase.js          ← Client Supabase cu fallback
│   ├── utils.js             ← Funcții comune (lang, escH, toast etc.)
│   ├── admin-nav.js         ← Navbar cu profil, admin link, limbă
│   └── genealogy-engine.js
├── sql/
│   ├── migration-v2.sql     ← Schema principală + RLS members/relations
│   ├── setup-photos-storage.sql ← Tabel photos + RLS
│   ├── rls-fix.sql          ← RLS pentru families, members (write), timeline
│   └── admin-setup.sql      ← Tabele admin: profiles, admin_logs,
│                                site_settings, announcements,
│                                contact_messages, timeline
├── .env                     ← Credențiale locale (gitignored)
├── .env.example             ← Template pentru alți dezvoltatori
├── .gitignore               ← Conține: .env
└── [13 fișiere HTML]        ← Toate cu scripturi și CSS în ordine corectă
```

### Ordinea corectă a scripturilor în `<head>` (toate paginile)
```html
<link rel="stylesheet" href="css/style.css">   <!-- 1. CSS comun -->
<style>/* CSS specific paginii */</style>       <!-- 2. CSS local -->
<script src="js/config.js"></script>            <!-- 3. Credențiale -->
<script src="js/supabase.js"></script>          <!-- 4. Client DB -->
<script src="js/utils.js"></script>             <!-- 5. Utilități -->
<script src="js/admin-nav.js"></script>         <!-- 6. Navbar (opțional) -->
```

### Supabase — tabele și RLS
| Tabel | RLS | Politici |
|-------|-----|----------|
| `families` | ✅ | public read, owner CRUD |
| `members` | ✅ | public read (non-private), owner CRUD |
| `member_relations` | ✅ | public read, owner write |
| `family_links` | ✅ | public read (confirmed), owner manage |
| `audit_log` | ✅ | owner read own |
| `photos` | ✅ | public read, auth upload, owner delete |
| `profiles` | ✅ | self read, admin read all |
| `admin_logs` | ✅ | admin read, auth insert |
| `site_settings` | ✅ | public read, admin write |
| `announcements` | ✅ | public read (active), admin manage |
| `contact_messages` | ✅ | public insert, admin manage |
| `timeline` | ✅ | public read, owner write |

---

*Generat de Claude Code — Calnic Online v2, 31 martie 2026*
