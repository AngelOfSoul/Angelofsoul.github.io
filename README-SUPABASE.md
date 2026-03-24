# Supabase Setup for Calnic Online

This guide walks you through connecting the Calnic Online static site to a live Supabase backend.
Until the steps below are completed, every page works normally with built-in demo data.

---

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New project** and name it `calnic-online`.
3. Choose a region close to Romania (e.g. **West EU (Ireland)** or **Central EU (Frankfurt)**).
4. Note your **Project URL** and **anon / public API key** (found in *Project Settings → API*).

---

## 2. Configure `supabase.js`

Open `supabase.js` at the root of this repository and replace the two placeholder values:

```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';      // → your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // → your anon/public key
```

Example:

```js
const SUPABASE_URL      = 'https://abcdefghijklmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

> **Security note:** the `anon` key is designed to be public. Row-Level Security policies
> (set up in Step 4) control what data is readable/writable without exposing secrets.

---

## 3. Create database tables

Open the **SQL Editor** in your Supabase dashboard and run the following:

```sql
-- Families table
create table families (
  id                  uuid default gen_random_uuid() primary key,
  owner_id            uuid references auth.users(id),
  name                text not null,
  village             text default 'Calnic',
  since               integer,
  desc_ro             text,
  desc_en             text,
  members_count       integer,
  generations_count   integer,
  photos_count        integer,
  show_members        boolean default true,
  show_generations    boolean default true,
  show_photos         boolean default true,
  show_since          boolean default true,
  has_public_photos   boolean default false,
  has_private_photos  boolean default false,
  pin_hash            text,
  created_at          timestamptz default now()
);

-- Members table
create table members (
  id          uuid default gen_random_uuid() primary key,
  family_id   uuid references families(id) on delete cascade,
  name        text not null,
  initial     text,
  role        text,
  birth_year  integer,
  death_year  integer,
  is_deceased boolean default false
);

-- Timeline events
create table timeline (
  id          uuid default gen_random_uuid() primary key,
  family_id   uuid references families(id) on delete cascade,
  year        integer not null,
  text_ro     text,
  text_en     text
);

-- PIN check function (compares stored base64 hash)
create or replace function check_family_pin(p_family_id uuid, p_pin text)
returns boolean language sql security definer as $$
  select pin_hash = encode(p_pin::bytea, 'base64')
  from families
  where id = p_family_id;
$$;
```

---

## 4. Enable Row-Level Security

Run this in the SQL Editor to lock down the tables:

```sql
-- Enable RLS
alter table families  enable row level security;
alter table members   enable row level security;
alter table timeline  enable row level security;

-- Anyone can read families
create policy "public read families"
  on families for select using (true);

-- Only the owner can update or insert their own family
create policy "owner can update family"
  on families for update using (auth.uid() = owner_id);

create policy "owner can insert family"
  on families for insert with check (auth.uid() = owner_id);

-- Anyone can read members and timeline
create policy "public read members"
  on members for select using (true);

create policy "public read timeline"
  on timeline for select using (true);

-- Only the family owner can write members and timeline
create policy "owner write members"
  on members for all using (
    auth.uid() = (select owner_id from families where id = family_id)
  );

create policy "owner write timeline"
  on timeline for all using (
    auth.uid() = (select owner_id from families where id = family_id)
  );
```

---

## 5. Enable Email Authentication

In the Supabase dashboard → **Authentication → Providers**:

1. Enable the **Email** provider.
2. Go to **Authentication → URL Configuration** and set:
   - **Site URL:** `https://calniconline.ro`
   - **Redirect URLs:** add `https://calniconline.ro/login.html`
   > ⚠️ If the domain is not yet connected, temporarily also add `https://angelofsoul.github.io` and `https://angelofsoul.github.io/login.html` until DNS is live.

---

## 6. Seed demo data (optional)

To pre-populate the 5 demo families from Phase 1, run the SQL in `seed-demo-data.sql`
in the Supabase SQL Editor.

---

## 8. Set up photo storage

This step wires the gallery upload form to Supabase Storage.

### 8a. Create the Storage bucket

1. In the Supabase dashboard, go to **Storage → New bucket**.
2. Name it exactly `photos`.
3. Toggle **Public bucket** to **ON** (so public photos load without auth headers).
4. Click **Create bucket**.

### 8b. Add Storage policies

In the Supabase dashboard → **Storage → photos → Policies**, add two policies:

| Policy name | Operation | Expression |
|---|---|---|
| Public read | SELECT | `true` |
| Authenticated upload | INSERT | `auth.uid() IS NOT NULL` |

### 8c. Create the photos table and RLS

Run the SQL in `setup-photos-storage.sql` in the **SQL Editor**.

This creates:
- `photos` table with all fields used by `galerie.html`
- RLS policies: public read, auth insert/update/delete

### 8d. How it works

After completing steps 8a–8c:
- The **"Adaugă fotografie"** button in `galerie.html` compresses the selected image
  (max 1200 px, JPEG 82%) and uploads it to the `photos` Storage bucket.
- The metadata row is inserted into the `photos` table.
- The gallery automatically reloads with real photos from the database.
- If no photos exist in the database yet, the gallery shows built-in demo data.

---

## 9. How the pages work

| Page | Behaviour |
|------|-----------|
| `familiile.html` | Loads family cards from Supabase; falls back to 5 demo families if Supabase is not configured |
| `familiile-familie.html` | Loads a single family by `?family=<uuid>`; falls back to Familia Popescu demo data |
| `login.html` | Full sign-in / registration page using Supabase Auth |

| `galerie.html` | Loads real photos from Supabase Storage; falls back to 8 demo photos if no photos in DB; upload form compresses + uploads to Storage bucket |

---

## 10. Troubleshooting

- **"Supabase not connected — showing demo data"** in browser console → your `supabase.js` still has placeholder values, or your browser is offline.
- **CORS error** → ensure your Site URL is correctly set in the Supabase Auth settings.
- **"Invalid API key"** → double-check you copied the **anon** key, not the **service_role** key.
