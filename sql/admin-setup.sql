-- admin-setup.sql — Calnic Online
-- Tabele necesare pentru admin panel si alte functionalitati.
-- SAFE TO RE-RUN: IF NOT EXISTS, fara DROP, politici in blocuri DO.
--
-- Tabele create:
--   profiles        — legatura auth.users <-> is_admin
--   admin_logs      — actiuni admin
--   site_settings   — setari site (maintenance mode etc.)
--   announcements   — anunturi publice
--   contact_messages — mesaje din formularul de contact
--   timeline        — evenimente istorice ale unei familii
--
-- Ruleaza in Supabase SQL Editor.

-- ════════════════════════════════════════════════════════════
-- 1. PROFILES
-- Extend auth.users cu camp is_admin.
-- Randul se creeaza automat la register via trigger.
-- ════════════════════════════════════════════════════════════

create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Adminul poate citi toate profilurile
do $$ begin
  create policy "admin read profiles"
    on profiles for select
    using (
      exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
    );
exception when duplicate_object then null; end $$;

-- Utilizatorul isi poate citi propriul profil
do $$ begin
  create policy "self read profile"
    on profiles for select
    using (id = auth.uid());
exception when duplicate_object then null; end $$;

-- Trigger: creeaza profil automat la inregistrare
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ════════════════════════════════════════════════════════════
-- 2. ADMIN LOGS
-- ════════════════════════════════════════════════════════════

create table if not exists admin_logs (
  id          uuid not null default gen_random_uuid() primary key,
  admin_email text,
  action      text not null,
  details     text,
  created_at  timestamptz not null default now()
);

alter table admin_logs enable row level security;

-- Doar adminii pot citi logurile
do $$ begin
  create policy "admin read admin_logs"
    on admin_logs for select
    using (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;

-- Orice utilizator logat poate insera (actiunile proprii)
do $$ begin
  create policy "auth insert admin_logs"
    on admin_logs for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- 3. SITE SETTINGS
-- ════════════════════════════════════════════════════════════

create table if not exists site_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

-- Oricine poate citi setarile (ex: maintenance mode)
do $$ begin
  create policy "public read site_settings"
    on site_settings for select
    using (true);
exception when duplicate_object then null; end $$;

-- Doar adminii pot modifica setarile
do $$ begin
  create policy "admin write site_settings"
    on site_settings for all
    using (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;

-- Valoare initiala pentru maintenance mode
insert into site_settings (key, value) values ('maintenance', 'false')
on conflict (key) do nothing;

-- ════════════════════════════════════════════════════════════
-- 4. ANNOUNCEMENTS
-- ════════════════════════════════════════════════════════════

create table if not exists announcements (
  id           uuid not null default gen_random_uuid() primary key,
  title        text not null,
  body         text not null,
  type         text not null default 'announcement' check (type in ('announcement','update')),
  published_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

alter table announcements enable row level security;

-- Oricine poate citi anunturile active (neexpirate)
do $$ begin
  create policy "public read announcements"
    on announcements for select
    using (expires_at > now());
exception when duplicate_object then null; end $$;

-- Adminii pot gestiona toate anunturile (inclusiv expirate)
do $$ begin
  create policy "admin manage announcements"
    on announcements for all
    using (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- 5. CONTACT MESSAGES
-- ════════════════════════════════════════════════════════════

create table if not exists contact_messages (
  id         uuid not null default gen_random_uuid() primary key,
  name       text,
  email      text,
  message    text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

-- Oricine poate trimite un mesaj (inclusiv anonim)
do $$ begin
  create policy "public insert contact_messages"
    on contact_messages for insert
    with check (true);
exception when duplicate_object then null; end $$;

-- Doar adminii pot citi si gestiona mesajele
do $$ begin
  create policy "admin manage contact_messages"
    on contact_messages for all
    using (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- 6. TIMELINE
-- Evenimente istorice ale unei familii.
-- ════════════════════════════════════════════════════════════

create table if not exists timeline (
  id         uuid not null default gen_random_uuid() primary key,
  family_id  uuid not null references families(id) on delete cascade,
  year       integer not null,
  text_ro    text,
  text_en    text,
  created_at timestamptz not null default now()
);

create index if not exists idx_timeline_family_id on timeline(family_id);
create index if not exists idx_timeline_year      on timeline(year);

alter table timeline enable row level security;

do $$ begin
  create policy "public read timeline"
    on timeline for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner write timeline"
    on timeline for all
    using (
      family_id in (select id from families where owner_id = auth.uid())
    )
    with check (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- VERIFICARE (optional)
-- ════════════════════════════════════════════════════════════
-- select tablename, policyname, cmd
-- from pg_policies
-- where tablename in ('profiles','admin_logs','site_settings','announcements','contact_messages','timeline')
-- order by tablename, cmd;
