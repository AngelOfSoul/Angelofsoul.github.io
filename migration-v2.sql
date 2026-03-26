-- migration-v2.sql — Calnic Online additive migration
-- Safe to run on existing database. No DROP statements.
-- Run in Supabase SQL Editor after the original schema.

create extension if not exists unaccent;

alter table members add column if not exists generation   integer;
alter table members add column if not exists visibility   text not null default 'public' check (visibility in ('public','family','private'));
alter table members add column if not exists is_living    boolean not null default false;
alter table members add column if not exists photo_url    text;
alter table members add column if not exists biography    text;
alter table members add column if not exists story        text;
alter table members add column if not exists location     text;
alter table members add column if not exists profession   text;
alter table members add column if not exists confidence   integer not null default 100 check (confidence between 0 and 100);

update members set is_living = true
where death_year is null and (is_deceased is null or is_deceased = false);

alter table families add column if not exists display_name          text;
alter table families add column if not exists connected_to_village  boolean not null default false;

update families set display_name = name || ' (' || coalesce(village,'Calnic') || ', ' || coalesce(since::text,'?') || ')'
where display_name is null;

create table if not exists member_relations (
  id             uuid not null default gen_random_uuid() primary key,
  from_member_id uuid not null references members(id) on delete cascade,
  to_member_id   uuid not null references members(id) on delete cascade,
  relation_type  text not null check (relation_type in ('parent','sibling','spouse','in_law','step','adopted')),
  is_biological  boolean not null default true,
  start_year     integer,
  end_year       integer,
  confidence     integer not null default 100 check (confidence between 0 and 100),
  confirmed_by   uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint no_self_relation check (from_member_id <> to_member_id)
);

create table if not exists family_links (
  id            uuid not null default gen_random_uuid() primary key,
  family_a_id   uuid not null references families(id) on delete cascade,
  family_b_id   uuid not null references families(id) on delete cascade,
  link_type     text not null check (link_type in ('blood','marriage','alliance','distant')),
  via_member_a  uuid references members(id) on delete set null,
  via_member_b  uuid references members(id) on delete set null,
  confirmed     boolean not null default false,
  auto_detected boolean not null default false,
  confirmed_by_a uuid references auth.users(id) on delete set null,
  confirmed_by_b uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint different_families check (family_a_id <> family_b_id)
);

create table if not exists audit_log (
  id         uuid not null default gen_random_uuid() primary key,
  table_name text not null,
  record_id  uuid not null,
  action     text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data   jsonb,
  new_data   jsonb,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_family_id   on members(family_id);
create index if not exists idx_members_visibility  on members(visibility);
-- FTS index: unaccent() is not IMMUTABLE by default, so we create an IMMUTABLE wrapper
-- and use plain 'simple' dictionary (handles Romanian names well enough) without unaccent for indexing.
-- Queries still use unaccent() at query time — only the index definition must be IMMUTABLE.
create or replace function immutable_unaccent(text)
returns text
language sql immutable strict parallel safe as
$$ select public.unaccent($1) $$;

create index if not exists idx_members_name_fts
  on members using gin(to_tsvector('simple', immutable_unaccent(name)));
create index if not exists idx_relations_from      on member_relations(from_member_id);
create index if not exists idx_relations_to        on member_relations(to_member_id);
create index if not exists idx_family_links_a      on family_links(family_a_id);
create index if not exists idx_family_links_b      on family_links(family_b_id);
create index if not exists idx_audit_log_record    on audit_log(table_name, record_id);
create index if not exists idx_audit_log_created   on audit_log(created_at desc);

create or replace function calnic_audit_trigger()
returns trigger language plpgsql security definer as $$
begin
  insert into audit_log(table_name, record_id, action, old_data, new_data, user_id)
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP,
    case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end,
    auth.uid()
  );
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists members_audit on members;
create trigger members_audit
  after insert or update or delete on members
  for each row execute function calnic_audit_trigger();

drop trigger if exists member_relations_audit on member_relations;
create trigger member_relations_audit
  after insert or update or delete on member_relations
  for each row execute function calnic_audit_trigger();

alter table member_relations enable row level security;
alter table family_links     enable row level security;
alter table audit_log        enable row level security;

do $$ begin
  create policy "public read member_relations"
    on member_relations for select
    using (exists (select 1 from members m where m.id = member_relations.from_member_id and m.visibility = 'public'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner write member_relations"
    on member_relations for all
    using (exists (select 1 from members m join families f on f.id = m.family_id where m.id = member_relations.from_member_id and f.owner_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read confirmed family_links"
    on family_links for select using (confirmed = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner manage family_links"
    on family_links for all
    using (family_a_id in (select id from families where owner_id = auth.uid())
        or family_b_id in (select id from families where owner_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner read audit_log"
    on audit_log for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin drop policy if exists "public read members" on members; exception when others then null; end $$;

do $$ begin
  create policy "public read members"
    on members for select
    using (
      (auth.uid() is not null and family_id in (select id from families where owner_id = auth.uid()))
      or
      (visibility = 'public' and (is_living = false or is_living is null))
    );
exception when duplicate_object then null; end $$;

create or replace function search_members(search_query text, limit_n integer default 20)
returns table(member_id uuid, member_name text, family_id uuid, family_name text, birth_year integer, death_year integer, profession text, location text, village text)
language sql security definer as $$
  select m.id, m.name, f.id, f.name, m.birth_year, m.death_year, m.profession, m.location, f.village
  from members m
  join families f on f.id = m.family_id
  where m.visibility = 'public'
    and (m.is_living = false or m.is_living is null)
    and to_tsvector('simple', immutable_unaccent(m.name)) @@ plainto_tsquery('simple', immutable_unaccent(search_query))
  order by ts_rank(to_tsvector('simple', immutable_unaccent(m.name)), plainto_tsquery('simple', immutable_unaccent(search_query))) desc
  limit limit_n;
$$;
