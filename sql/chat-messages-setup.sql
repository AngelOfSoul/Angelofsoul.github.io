-- Setup pentru tabela chat_messages + politici RLS
-- SAFE TO RE-RUN: IF NOT EXISTS + blocuri DO pentru politici.
-- Ruleaza in Supabase SQL Editor.

create table if not exists chat_messages (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  body                text not null,
  author_type         text not null default 'guest' check (author_type in ('guest','member','admin')),
  author_display_name text not null default 'Anonim',
  user_id             uuid null references auth.users(id) on delete set null,
  guest_id            text null,
  status              text not null default 'active' check (status in ('active','reported','deleted','pinned')),
  reply_to_id         uuid null,
  reply_to_name       text null,
  reply_to_body       text null
);

create index if not exists idx_chat_messages_created_at on chat_messages(created_at desc);
create index if not exists idx_chat_messages_status on chat_messages(status);

alter table chat_messages enable row level security;

-- Citire publica doar pentru mesaje vizibile in chat.
do $$ begin
  create policy "public read visible chat_messages"
    on chat_messages for select
    using (
      status in ('active', 'pinned')
      or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;

-- Insert permis pentru toti (autentificati sau vizitatori).
do $$ begin
  create policy "public insert chat_messages"
    on chat_messages for insert
    with check (true);
exception when duplicate_object then null; end $$;

-- Userul isi poate modera propriile mesaje.
do $$ begin
  create policy "owner update own chat_messages"
    on chat_messages for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Adminii pot gestiona toate mesajele.
do $$ begin
  create policy "admin manage chat_messages"
    on chat_messages for all
    using (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
    with check (
      exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;

