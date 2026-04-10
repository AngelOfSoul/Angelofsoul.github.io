-- Return private family members/timeline after valid PIN check
-- Run in Supabase SQL editor

create or replace function public.get_family_bundle_with_pin(
  p_family_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean := false;
  v_out jsonb;
begin
  begin
    select coalesce(public.check_family_pin(p_family_id, p_pin), false) into v_ok;
  exception when undefined_function then
    v_ok := false;
  end;

  if not v_ok then
    return jsonb_build_object('members', '[]'::jsonb, 'timeline', '[]'::jsonb);
  end if;

  v_out := jsonb_build_object(
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.name,
          'initial', m.initial,
          'role', m.role,
          'birth_year', m.birth_year,
          'death_year', m.death_year,
          'is_deceased', m.is_deceased,
          'is_living', m.is_living,
          'profession', m.profession,
          'location', m.location,
          'biography', m.biography,
          'story', m.story,
          'visibility', m.visibility,
          'confidence', m.confidence,
          'photo_url', m.photo_url
        )
        order by m.birth_year nulls last, m.name
      )
      from public.members m
      where m.family_id = p_family_id
    ), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'year', t.year,
          'text_ro', t.text_ro,
          'text_en', t.text_en
        )
        order by t.year nulls last, t.id
      )
      from public.timeline t
      where t.family_id = p_family_id
    ), '[]'::jsonb)
  );

  return v_out;
end;
$$;

grant execute on function public.get_family_bundle_with_pin(uuid, text) to anon, authenticated;