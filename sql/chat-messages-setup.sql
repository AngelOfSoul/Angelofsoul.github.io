-- Setup / repair pentru tabela chat_messages + politici RLS
-- SAFE TO RE-RUN.
-- Ruleaza in Supabase SQL Editor.

create table if not exists chat_messages (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  body                text not null,
  author_type         text not null default 'guest' check (author_type in ('guest','member','admin')),
  author_display_name text not null default 'Anonim',
  user_id             uuid null references auth.users(id) on delete set null,
  guest_id            text null,
  status              text not null default 'active' check (status in ('active','reported','deleted','pinned')),
  reply_to_id         uuid null,
  reply_to_name       text null,
  reply_to_body       text null
);

create index if not exists idx_chat_messages_created_at on chat_messages(created_at desc);
create index if not exists idx_chat_messages_status on chat_messages(status);

alter table chat_messages enable row level security;

-- Eliminam toate politicile vechi de pe chat_messages
-- (inclusiv cele care pot referi gresit tabela users).
do $$
declare pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'chat_messages'
  loop
    execute format('drop policy if exists %I on public.chat_messages', pol.policyname);
  end loop;
end $$;

-- Helper securizat: verificare admin prin profiles (fara referinte la users).
create or replace function public.chat_is_admin(_uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _uid and p.is_admin = true
  );
$$;

revoke all on function public.chat_is_admin(uuid) from public;
grant execute on function public.chat_is_admin(uuid) to anon, authenticated;

-- Helper: verifica daca userul are voie sa posteze linkuri in chat,
-- pe baza setarilor din site_settings.key='chat_moderation'.
-- Compatibil cu ambele chei:
--   allow_links_global (nou)
--   block_links (legacy)
create or replace function public.chat_can_post_links(_uid uuid default auth.uid())
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg jsonb := '{}'::jsonb;
  allow_global boolean := false;
begin
  if to_regclass('public.site_settings') is not null then
    begin
      select coalesce(value::jsonb, '{}'::jsonb)
      into cfg
      from public.site_settings
      where key = 'chat_moderation'
      limit 1;
    exception when others then
      cfg := '{}'::jsonb;
    end;
  end if;

  if cfg ? 'allow_links_global' then
    allow_global := coalesce((cfg->>'allow_links_global')::boolean, false);
  elsif cfg ? 'block_links' then
    allow_global := not coalesce((cfg->>'block_links')::boolean, true);
  else
    allow_global := false;
  end if;

  if allow_global then
    return true;
  end if;

  if _uid is null then
    return false;
  end if;

  return exists (
    select 1
    from jsonb_array_elements_text(coalesce(cfg->'allow_link_user_ids', '[]'::jsonb)) as u(uid_text)
    where u.uid_text = _uid::text
  );
end;
$$;

revoke all on function public.chat_can_post_links(uuid) from public;
grant execute on function public.chat_can_post_links(uuid) to anon, authenticated;

-- Citire publica doar pentru mesaje vizibile; admin vede tot.
create policy "chat_select_visible_or_admin"
  on chat_messages for select
  using (
    status in ('active', 'pinned')
    or public.chat_is_admin(auth.uid())
  );

-- Insert permis pentru toti (autentificati sau vizitatori).
create policy "chat_insert_public"
  on chat_messages for insert
  with check (true);

-- Userul isi poate modera propriile mesaje.
create policy "chat_update_own"
  on chat_messages for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Adminii pot gestiona toate mesajele.
create policy "chat_admin_all"
  on chat_messages for all
  using (public.chat_is_admin(auth.uid()))
  with check (public.chat_is_admin(auth.uid()));
