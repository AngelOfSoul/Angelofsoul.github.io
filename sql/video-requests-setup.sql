-- Calnic Online
-- Video submission requests setup (FinalGallery <-> Admin Panel)

create extension if not exists pgcrypto;

create table if not exists public.video_submission_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  requester_name text,
  requester_email text,
  family_id uuid references public.families(id) on delete set null,
  family_name text,
  title text not null,
  description text,
  preferred_channel text not null default 'whatsapp',
  contact_handle text not null,
  request_code text not null unique,
  source text not null default 'FinalGallery',
  status text not null default 'new',
  read_by_admin boolean not null default false,
  admin_reply text,
  admin_note text,
  file_received_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_submission_requests_status_check check (
    status in ('new','in_progress','file_received','approved','published','rejected','archived')
  ),
  constraint video_submission_requests_channel_check check (
    preferred_channel in ('whatsapp','telegram','wetransfer','google_drive','email')
  )
);

create or replace function public.set_video_submission_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_video_submission_requests_updated_at on public.video_submission_requests;
create trigger trg_video_submission_requests_updated_at
before update on public.video_submission_requests
for each row
execute function public.set_video_submission_requests_updated_at();

create index if not exists idx_video_submission_requests_status
  on public.video_submission_requests(status);
create index if not exists idx_video_submission_requests_created_at
  on public.video_submission_requests(created_at desc);
create index if not exists idx_video_submission_requests_family_id
  on public.video_submission_requests(family_id);
create index if not exists idx_video_submission_requests_requester_id
  on public.video_submission_requests(requester_id);
create index if not exists idx_video_submission_requests_read_by_admin
  on public.video_submission_requests(read_by_admin);

alter table public.video_submission_requests enable row level security;

drop policy if exists "insert own video requests" on public.video_submission_requests;
create policy "insert own video requests"
on public.video_submission_requests
for insert
to authenticated
with check (auth.uid() = requester_id);

drop policy if exists "read own video requests" on public.video_submission_requests;
create policy "read own video requests"
on public.video_submission_requests
for select
to authenticated
using (auth.uid() = requester_id);

drop policy if exists "admin read all video requests" on public.video_submission_requests;
create policy "admin read all video requests"
on public.video_submission_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "admin update all video requests" on public.video_submission_requests;
create policy "admin update all video requests"
on public.video_submission_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "admin delete all video requests" on public.video_submission_requests;
create policy "admin delete all video requests"
on public.video_submission_requests
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);
