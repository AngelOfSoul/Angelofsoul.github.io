-- rls-fix.sql — Calnic Online
-- Politici RLS complete pentru toate tabelele.
-- SAFE TO RE-RUN: fara DROP, fiecare politica in bloc DO cu exceptie la duplicat.
--
-- Tabele acoperite:
--   families        — enable RLS + public read + owner CRUD
--   members         — write policies (SELECT exista deja in migration-v2.sql)
--   member_relations — verificat OK in migration-v2.sql
--   timeline        — enable RLS + public read + owner write
--
-- Ruleaza in Supabase SQL Editor.

-- ════════════════════════════════════════════════════════════
-- 1. FAMILIES
-- ════════════════════════════════════════════════════════════

alter table families enable row level security;

-- Oricine poate citi toate familiile
do $$ begin
  create policy "public read families"
    on families for select
    using (true);
exception when duplicate_object then null; end $$;

-- Proprietarul poate crea familii
do $$ begin
  create policy "owner insert family"
    on families for insert
    with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Proprietarul poate modifica propria familie
do $$ begin
  create policy "owner update family"
    on families for update
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Proprietarul poate sterge propria familie
do $$ begin
  create policy "owner delete family"
    on families for delete
    using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- 2. MEMBERS — write policies
-- (SELECT exista deja in migration-v2.sql)
-- ════════════════════════════════════════════════════════════

-- Proprietarul familiei poate adauga membri
do $$ begin
  create policy "owner insert member"
    on members for insert
    with check (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- Proprietarul familiei poate modifica membrii
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

-- Proprietarul familiei poate sterge membri
do $$ begin
  create policy "owner delete member"
    on members for delete
    using (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- 3. TIMELINE
-- ════════════════════════════════════════════════════════════

alter table timeline enable row level security;

-- Oricine poate citi evenimentele de pe timeline
do $$ begin
  create policy "public read timeline"
    on timeline for select
    using (true);
exception when duplicate_object then null; end $$;

-- Proprietarul familiei poate scrie pe timeline
do $$ begin
  create policy "owner write timeline"
    on timeline for all
    using (
      family_id in (select id from families where owner_id = auth.uid())
    )
    with check (
      family_id in (select id from families where owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- ════════════════════════════════════════════════════════════
-- 4. VERIFICARE (optional — ruleaza manual sa confirmi)
-- ════════════════════════════════════════════════════════════
-- select tablename, policyname, cmd, qual
-- from pg_policies
-- where tablename in ('families','members','member_relations','timeline','audit_log','family_links','photos')
-- order by tablename, cmd;
