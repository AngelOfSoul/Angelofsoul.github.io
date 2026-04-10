-- Admin hard-delete utilities for families and accounts
-- Run in Supabase SQL Editor (safe to re-run).

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_delete_family_cascade(p_family_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
  v_member_ids uuid[];
  v_photo_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Admin access required';
  end if;

  if p_family_id is null then
    raise exception 'Missing family id';
  end if;

  select array_agg(m.id)
    into v_member_ids
  from public.members m
  where m.family_id = p_family_id;

  select array_agg(p.id)
    into v_photo_ids
  from public.photos p
  where p.family_id = p_family_id;

  if v_photo_ids is not null and array_length(v_photo_ids, 1) > 0 then
    begin
      delete from public.photo_reports where photo_id = any(v_photo_ids);
    exception when undefined_table then null; end;
  end if;

  begin delete from public.photos where family_id = p_family_id; exception when undefined_table then null; end;
  begin delete from public.timeline where family_id = p_family_id; exception when undefined_table then null; end;
  begin delete from public.family_links where family_a_id = p_family_id or family_b_id = p_family_id; exception when undefined_table then null; end;

  if v_member_ids is not null and array_length(v_member_ids, 1) > 0 then
    begin delete from public.member_relations where from_member_id = any(v_member_ids) or to_member_id = any(v_member_ids); exception when undefined_table then null; end;
    begin delete from public.member_history where member_id = any(v_member_ids); exception when undefined_table then null; end;
  end if;

  begin delete from public.members where family_id = p_family_id; exception when undefined_table then null; end;
  begin delete from public.badges_user where user_id in (select created_by from public.families where id = p_family_id); exception when undefined_table then null; end;
  delete from public.families where id = p_family_id;

  return true;
end;
$$;

create or replace function public.admin_delete_user_account(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
  v_deleted_families integer := 0;
  v_family_ids uuid[];
  v_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Admin access required';
  end if;

  if p_user_id is null then
    raise exception 'Missing user id';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Refusing to delete the currently logged-in admin account';
  end if;

  select array_agg(distinct f.id)
    into v_family_ids
  from public.families f
  where f.created_by = p_user_id
     or f.owner_id = p_user_id;

  if v_family_ids is not null then
    foreach v_family_id in array v_family_ids
    loop
      perform public.admin_delete_family_cascade(v_family_id);
      v_deleted_families := v_deleted_families + 1;
    end loop;
  end if;

  begin delete from public.badges_user where user_id = p_user_id; exception when undefined_table then null; end;
  begin delete from public.chat_messages where user_id = p_user_id; exception when undefined_table then null; end;
  begin delete from public.poll_votes where user_id = p_user_id; exception when undefined_table then null; end;
  begin delete from public.photo_reports where reporter_id = p_user_id; exception when undefined_table then null; end;
  begin delete from public.contact_messages where user_id = p_user_id; exception when undefined_column then null; when undefined_table then null; end;

  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'deleted_user_id', p_user_id,
    'deleted_families', v_deleted_families
  );
end;
$$;

revoke all on function public.admin_delete_family_cascade(uuid) from public;
grant execute on function public.admin_delete_family_cascade(uuid) to authenticated;

revoke all on function public.admin_delete_user_account(uuid) from public;
grant execute on function public.admin_delete_user_account(uuid) to authenticated;

