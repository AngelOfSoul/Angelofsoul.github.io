-- Polls setup (safe to re-run)
-- Run in Supabase SQL editor.

create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  description text,
  status      text not null default 'active' check (status in ('active','closed')),
  allow_other boolean not null default false,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.poll_options (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references public.polls(id) on delete cascade,
  label       text not null,
  votes_count integer not null default 0 check (votes_count >= 0),
  position    integer not null default 0
);

create unique index if not exists poll_options_poll_position_uniq
  on public.poll_options(poll_id, position);
create index if not exists poll_options_poll_id_idx
  on public.poll_options(poll_id);

create table if not exists public.poll_votes (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references public.polls(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  option_id   uuid null references public.poll_options(id) on delete set null,
  suggestion  text,
  created_at  timestamptz not null default now(),
  unique (poll_id, user_id),
  constraint poll_votes_choice_check
    check (
      (option_id is not null and coalesce(nullif(trim(suggestion), ''), '') = '')
      or
      (option_id is null and coalesce(nullif(trim(suggestion), ''), '') <> '')
    )
);

create index if not exists poll_votes_poll_id_idx on public.poll_votes(poll_id);
create index if not exists poll_votes_user_id_idx on public.poll_votes(user_id);

create or replace function public.poll_vote_option_matches_poll()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.option_id is not null then
    if not exists (
      select 1
      from public.poll_options po
      where po.id = new.option_id
        and po.poll_id = new.poll_id
    ) then
      raise exception 'Option does not belong to poll';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_poll_vote_option_matches_poll on public.poll_votes;
create trigger trg_poll_vote_option_matches_poll
before insert or update on public.poll_votes
for each row execute function public.poll_vote_option_matches_poll();

create or replace function public.poll_votes_sync_counts()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    if new.option_id is not null then
      update public.poll_options
      set votes_count = votes_count + 1
      where id = new.option_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.option_id is not null then
      update public.poll_options
      set votes_count = greatest(votes_count - 1, 0)
      where id = old.option_id;
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.option_id is distinct from new.option_id then
      if old.option_id is not null then
        update public.poll_options
        set votes_count = greatest(votes_count - 1, 0)
        where id = old.option_id;
      end if;
      if new.option_id is not null then
        update public.poll_options
        set votes_count = votes_count + 1
        where id = new.option_id;
      end if;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_poll_votes_sync_counts on public.poll_votes;
create trigger trg_poll_votes_sync_counts
after insert or update or delete on public.poll_votes
for each row execute function public.poll_votes_sync_counts();

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

do $$ begin
  create policy "polls_select_all"
    on public.polls for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "polls_admin_all"
    on public.polls for all
    using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
    with check (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "poll_options_select_all"
    on public.poll_options for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "poll_options_admin_all"
    on public.poll_options for all
    using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
    with check (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "poll_votes_select_own_or_admin"
    on public.poll_votes for select
    using (
      auth.uid() = user_id
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "poll_votes_insert_own"
    on public.poll_votes for insert
    with check (auth.uid() is not null and auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "poll_votes_admin_update_delete"
    on public.poll_votes for update
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
    with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "poll_votes_admin_delete"
    on public.poll_votes for delete
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
exception when duplicate_object then null; end $$;
