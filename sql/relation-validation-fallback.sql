-- Fallback validator for direct relations used by genealogie-familie.html
-- Safe to run multiple times.

create or replace function public.validate_direct_relation(
  p_from_id uuid,
  p_to_id uuid,
  p_relation_type text
)
returns table(ok boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text := lower(coalesce(trim(p_relation_type), ''));
  v_from_year int;
  v_to_year int;
  v_gap int;
  v_parent_roles text[] := array['tata','mama','step','adopted','parent'];
  v_child_roles text[] := array['fiu','fiica','child'];
begin
  select birth_year into v_from_year from public.members where id = p_from_id;
  select birth_year into v_to_year from public.members where id = p_to_id;

  if v_from_year is null or v_to_year is null then
    return query select true, 'ok';
    return;
  end if;

  if v_type = any(v_parent_roles) then
    -- relation_type describes TO relative to FROM => TO is parent of FROM
    v_gap := v_from_year - v_to_year;
    if v_gap < 12 then
      return query select false, 'Age gap too small for parent-child relation';
      return;
    end if;
  elsif v_type = any(v_child_roles) then
    -- TO is child of FROM
    v_gap := v_to_year - v_from_year;
    if v_gap < 12 then
      return query select false, 'Age gap too small for parent-child relation';
      return;
    end if;
  elsif v_type in ('bunic','bunica','grandparent') then
    v_gap := v_from_year - v_to_year;
    if v_gap < 24 then
      return query select false, 'Age gap too small for grandparent relation';
      return;
    end if;
  elsif v_type in ('strabunic','strabunica') then
    v_gap := v_from_year - v_to_year;
    if v_gap < 36 then
      return query select false, 'Age gap too small for great-grandparent relation';
      return;
    end if;
  end if;

  return query select true, 'ok';
end;
$$;

grant execute on function public.validate_direct_relation(uuid, uuid, text) to anon, authenticated, service_role;
