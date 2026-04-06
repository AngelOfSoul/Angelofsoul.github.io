-- Badges system for Calnic Online
-- Run in Supabase SQL editor

create table if not exists public.badge_definitions (
  id bigserial primary key,
  slug text not null unique,
  label text not null,
  description text not null,
  color_base text not null,
  color_dark text not null,
  color_accent text not null,
  icon text not null,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id bigint not null references public.badge_definitions(id) on delete cascade,
  assigned_by uuid null references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  is_primary boolean not null default false,
  unique(user_id, badge_id)
);

create unique index if not exists uq_user_primary_badge
  on public.user_badges(user_id)
  where is_primary = true;

create index if not exists idx_user_badges_user_id on public.user_badges(user_id);
create index if not exists idx_user_badges_badge_id on public.user_badges(badge_id);

alter table public.badge_definitions enable row level security;
alter table public.user_badges enable row level security;

-- Public read for rendering badges on public family cards / profile pages
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='badge_definitions' and policyname='badge_definitions_select_all'
  ) then
    create policy badge_definitions_select_all
      on public.badge_definitions
      for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_badges' and policyname='user_badges_select_all'
  ) then
    create policy user_badges_select_all
      on public.user_badges
      for select
      using (true);
  end if;
end $$;

-- Admin write only
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='badge_definitions' and policyname='badge_definitions_admin_write'
  ) then
    create policy badge_definitions_admin_write
      on public.badge_definitions
      for all
      to authenticated
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_badges' and policyname='user_badges_admin_write'
  ) then
    create policy user_badges_admin_write
      on public.user_badges
      for all
      to authenticated
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
  end if;
end $$;

insert into public.badge_definitions (slug, label, description, color_base, color_dark, color_accent, icon, sort_order)
values
('fondator', 'Fondator', 'Creator al proiectului sau membru din nucleul initial.', '#D4A63A', '#8A6217', '#F1CF75', 'crown', 10),
('helper', 'Helper', 'Membru care ajuta alti utilizatori.', '#2F6DB3', '#1A3E6A', '#74A9E4', 'help', 20),
('membru-de-onoare', 'Membru de onoare', 'Membru apreciat in mod special.', '#6E4BAE', '#3D2868', '#B397E8', 'medal', 30),
('contribuitor', 'Contribuitor', 'Membru care adauga continut sau informatii utile.', '#2E8B57', '#1A5033', '#6FC893', 'feather', 40),
('veteran', 'Veteran', 'Membru vechi al comunitatii.', '#9C6B30', '#5A3B1A', '#D4A46A', 'shield', 50),
('distinctie-speciala', 'Distinctie speciala', 'Acordata pentru merite deosebite.', '#8B2E3C', '#501822', '#CB6C7A', 'seal', 60),
('om-de-incredere', 'Om de incredere', 'Membru serios, respectat si de incredere.', '#1F3C68', '#11233E', '#5C86BE', 'check-shield', 70),
('moderator', 'Moderator', 'Membru cu rol oficial de moderare.', '#7A1F2A', '#441017', '#BA5A67', 'gavel', 80)
on conflict (slug) do update
set
  label = excluded.label,
  description = excluded.description,
  color_base = excluded.color_base,
  color_dark = excluded.color_dark,
  color_accent = excluded.color_accent,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
