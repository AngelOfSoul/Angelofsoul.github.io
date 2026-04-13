-- finalgallery-unify-photos-insert-policy.sql
-- Optional cleanup: keep a single INSERT policy on public.photos
-- SAFE TO RE-RUN.

-- Remove legacy/duplicate insert policy if present
do $$
begin
  begin
    drop policy "auth upload photos" on public.photos;
  exception when undefined_object then
    null;
  end;
end $$;

-- Ensure canonical insert policy exists with strict checks
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'photos'
      and policyname = 'auth insert photos'
  ) then
    create policy "auth insert photos"
      on public.photos
      for insert
      to authenticated
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
  else
    alter policy "auth insert photos"
      on public.photos
      to authenticated
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
  end if;
end $$;

-- Quick verification:
-- select tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public' and tablename = 'photos' and cmd = 'INSERT';
