-- Family PIN setup (Supabase / Postgres)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table public.families
  add column if not exists pin_hash text;

create or replace function public.check_family_pin(p_family_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
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

  -- Supports both:
  -- 1) new secure hash via crypt()
  -- 2) legacy base64 PIN values from older frontend flow
  return (v_hash = crypt(p_pin, v_hash))
      or (v_hash = encode(convert_to(p_pin, 'UTF8'), 'base64'));
end;
$$;

create or replace function public.set_family_pin(p_family_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
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
        f.created_by = auth.uid()
        or auth.role() = 'service_role'
      )
  ) then
    raise exception 'No permission to update this family PIN';
  end if;

  update public.families
  set pin_hash = crypt(p_pin, gen_salt('bf'))
  where id = p_family_id;

  return true;
end;
$$;

grant execute on function public.check_family_pin(uuid, text) to anon, authenticated, service_role;
grant execute on function public.set_family_pin(uuid, text) to authenticated, service_role;

