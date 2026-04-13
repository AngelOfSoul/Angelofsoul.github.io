-- finalgallery-security-setup.sql
-- Consolidates PIN-based private photo access + safer photos RLS for FinalGallery.
-- SAFE TO RE-RUN.

-- PIN core dependencies (prevents "function crypt(text,text) does not exist")
create extension if not exists pgcrypto with schema extensions;

alter table public.families
  add column if not exists pin_hash text;

create or replace function public.check_family_pin(p_family_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if p_pin is null or p_pin !~ '^[0-9]{4,8}$' then
    return false;
  end if;

  select f.pin_hash
    into v_hash
  from public.families f
  where f.id = p_family_id;

  if v_hash is null or v_hash = '' then
    return false;
  end if;

  return (v_hash = extensions.crypt(p_pin, v_hash))
      or (v_hash = encode(convert_to(p_pin, 'UTF8'), 'base64'));
end;
$$;

create or replace function public.set_family_pin(p_family_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'PIN must be 4-8 digits';
  end if;

  if not exists (
    select 1
    from public.families f
    where f.id = p_family_id
      and (
        f.owner_id = auth.uid()
        or f.created_by = auth.uid()
        or auth.role() = 'service_role'
      )
  ) then
    raise exception 'No permission to update this family PIN';
  end if;

  update public.families
  set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf'))
  where id = p_family_id;

  return true;
end;
$$;

grant execute on function public.check_family_pin(uuid, text) to anon, authenticated, service_role;
grant execute on function public.set_family_pin(uuid, text) to authenticated, service_role;

-- 0) Helper: admin check
create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = p_user_id
      and coalesce(p.is_admin, false) = true
  );
$$;

grant execute on function public.is_admin_user(uuid) to authenticated;

-- 1) Store PIN grants per user/family (time-limited)
create table if not exists public.family_pin_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours'),
  primary key (user_id, family_id)
);

create index if not exists idx_family_pin_access_family on public.family_pin_access(family_id);
create index if not exists idx_family_pin_access_expires on public.family_pin_access(expires_at desc);

alter table public.family_pin_access enable row level security;

do $$ begin
  create policy "read own family_pin_access"
    on public.family_pin_access
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "delete own family_pin_access"
    on public.family_pin_access
    for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- 2) Grant PIN access via RPC
create or replace function public.grant_family_pin_access(
  p_family_id uuid,
  p_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ok boolean := false;
begin
  if v_uid is null then
    return false;
  end if;

  begin
    select coalesce(public.check_family_pin(p_family_id, p_pin), false) into v_ok;
  exception when undefined_function then
    return false;
  end;

  if not v_ok then
    return false;
  end if;

  insert into public.family_pin_access(user_id, family_id, granted_at, expires_at)
  values (v_uid, p_family_id, now(), now() + interval '12 hours')
  on conflict (user_id, family_id)
  do update
    set granted_at = excluded.granted_at,
        expires_at = excluded.expires_at;

  return true;
end;
$$;

grant execute on function public.grant_family_pin_access(uuid, text) to authenticated;

-- 3) Tighten existing insert policy (if exists)
do $$
begin
  begin
    alter policy "auth insert photos"
      on public.photos
      with check (
        auth.uid() is not null
        and uploader_id = auth.uid()
        and (
          (family_id is null and public.is_admin_user(auth.uid()))
          or
          (family_id in (
            select f.id
            from public.families f
            where f.owner_id = auth.uid()
               or f.created_by = auth.uid()
          ))
        )
      );
  exception when undefined_object then
    null;
  end;
end $$;

-- 4) Private read for owners
do $$ begin
  create policy "owner read family private photos"
    on public.photos
    for select
    using (
      is_private = true
      and family_id is not null
      and family_id in (
        select f.id
        from public.families f
        where f.owner_id = auth.uid()
           or f.created_by = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- 5) Private read for users with valid PIN grant
do $$ begin
  create policy "pin read family private photos"
    on public.photos
    for select
    using (
      is_private = true
      and family_id is not null
      and exists (
        select 1
        from public.family_pin_access a
        where a.user_id = auth.uid()
          and a.family_id = photos.family_id
          and a.expires_at > now()
      )
    );
exception when duplicate_object then null; end $$;

-- 6) Admin full read
do $$ begin
  create policy "admin read all photos"
    on public.photos
    for select
    using (public.is_admin_user(auth.uid()));
exception when duplicate_object then null; end $$;

-- 7) Owner update/delete within own family
do $$ begin
  create policy "owner update family photos"
    on public.photos
    for update
    using (
      family_id is not null
      and family_id in (
        select f.id from public.families f
        where f.owner_id = auth.uid()
           or f.created_by = auth.uid()
      )
    )
    with check (
      family_id is not null
      and family_id in (
        select f.id from public.families f
        where f.owner_id = auth.uid()
           or f.created_by = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner delete family photos"
    on public.photos
    for delete
    using (
      family_id is not null
      and family_id in (
        select f.id from public.families f
        where f.owner_id = auth.uid()
           or f.created_by = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- 8) Admin update/delete
do $$ begin
  create policy "admin update any photos"
    on public.photos
    for update
    using (public.is_admin_user(auth.uid()))
    with check (public.is_admin_user(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin delete any photos"
    on public.photos
    for delete
    using (public.is_admin_user(auth.uid()));
exception when duplicate_object then null; end $$;

-- Optional verification query:
-- select tablename, policyname, cmd
-- from pg_policies
-- where schemaname='public'
--   and tablename in ('photos','family_pin_access')
-- order by tablename, policyname, cmd;
