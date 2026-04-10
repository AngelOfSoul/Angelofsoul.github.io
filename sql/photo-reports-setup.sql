-- photo-reports-setup.sql
-- Adds persistent photo reporting for gallery moderation in admin.
-- Safe to re-run.

create table if not exists photo_reports (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references photos(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason      text not null,
  details     text,
  status      text not null default 'open' check (status in ('open','reviewed','resolved','dismissed')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_photo_reports_photo_id on photo_reports(photo_id);
create index if not exists idx_photo_reports_status on photo_reports(status);
create index if not exists idx_photo_reports_created_at on photo_reports(created_at desc);

alter table photo_reports enable row level security;

-- Anyone can submit a report (including non-authenticated visitors).
do $$ begin
  create policy "anyone insert photo reports"
    on photo_reports
    for insert
    to public
    with check (true);
exception when duplicate_object then null;
end $$;

-- Admin-only read/update/delete.
do $$ begin
  create policy "admin read photo reports"
    on photo_reports
    for select
    using (
      exists (
        select 1
        from profiles p
        where p.id = auth.uid()
          and coalesce(p.is_admin, false) = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "admin update photo reports"
    on photo_reports
    for update
    using (
      exists (
        select 1
        from profiles p
        where p.id = auth.uid()
          and coalesce(p.is_admin, false) = true
      )
    )
    with check (
      exists (
        select 1
        from profiles p
        where p.id = auth.uid()
          and coalesce(p.is_admin, false) = true
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "admin delete photo reports"
    on photo_reports
    for delete
    using (
      exists (
        select 1
        from profiles p
        where p.id = auth.uid()
          and coalesce(p.is_admin, false) = true
      )
    );
exception when duplicate_object then null;
end $$;