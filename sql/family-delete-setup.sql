-- Delete family (owner) with cascade cleanup
-- Run in Supabase SQL Editor.

create or replace function public.delete_family_cascade(p_family_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean := false;
  v_member_ids uuid[];
  v_photo_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  begin
    select exists(
      select 1 from public.families f
      where f.id = p_family_id
        and f.created_by = auth.uid()
    ) into v_allowed;
  exception when undefined_column then
    select exists(
      select 1 from public.families f
      where f.id = p_family_id
        and f.owner_id = auth.uid()
    ) into v_allowed;
  end;

  if not v_allowed then
    raise exception 'No permission to delete this family';
  end if;

  begin
    select array_agg(m.id) into v_member_ids
    from public.members m
    where m.family_id = p_family_id;
  exception when undefined_table then
    v_member_ids := null;
  end;

  begin
    select array_agg(p.id) into v_photo_ids
    from public.photos p
    where p.family_id = p_family_id;
  exception when undefined_table then
    v_photo_ids := null;
  end;

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
  delete from public.families where id = p_family_id;

  return true;
end;
$$;

grant execute on function public.delete_family_cascade(uuid) to authenticated, service_role;

