-- Repair ownership so family members can be added again in Dashboard
-- Run this in Supabase SQL Editor once.

alter table families add column if not exists owner_id uuid;
alter table families add column if not exists created_by uuid;

update families
set owner_id = created_by
where owner_id is null and created_by is not null;

-- If you already know a family that belongs to the currently logged in account,
-- you can also run a manual update for it if needed:
-- update families set owner_id = ''YOUR-USER-ID'' where id = ''YOUR-FAMILY-ID'';

alter table members enable row level security;

do $$ begin
  create policy "owner insert member"
    on members for insert
    with check (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner update member"
    on members for update
    using (
      family_id in (select id from families where owner_id = auth.uid())
    )
    with check (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner delete member"
    on members for delete
    using (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;
