-- Health check: polls + contact inbox
-- Run in Supabase SQL Editor (safe, read-only).

-- ============================================================
-- 1) TABLE + COLUMN CHECKS
-- ============================================================
select
  'contact_messages' as table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'contact_messages'
order by ordinal_position;

select
  'poll_votes' as table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'poll_votes'
order by ordinal_position;

-- ============================================================
-- 2) RLS ENABLED CHECK
-- ============================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('contact_messages', 'polls', 'poll_options', 'poll_votes')
order by c.relname;

-- ============================================================
-- 3) POLICY CHECKS (expect specific policy names)
-- ============================================================
select
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in ('contact_messages', 'polls', 'poll_options', 'poll_votes')
order by tablename, policyname;

-- Quick expected-policy matrix
select
  tablename,
  sum(case when policyname = 'admin manage contact_messages' then 1 else 0 end) as has_admin_manage_contact_messages,
  sum(case when policyname = 'public insert contact_messages' then 1 else 0 end) as has_public_insert_contact_messages,
  sum(case when policyname = 'polls_select_all' then 1 else 0 end) as has_polls_select_all,
  sum(case when policyname = 'polls_admin_all' then 1 else 0 end) as has_polls_admin_all,
  sum(case when policyname = 'poll_options_select_all' then 1 else 0 end) as has_poll_options_select_all,
  sum(case when policyname = 'poll_options_admin_all' then 1 else 0 end) as has_poll_options_admin_all,
  sum(case when policyname = 'poll_votes_select_own_or_admin' then 1 else 0 end) as has_poll_votes_select_own_or_admin,
  sum(case when policyname = 'poll_votes_insert_own' then 1 else 0 end) as has_poll_votes_insert_own,
  sum(case when policyname = 'poll_votes_admin_update_delete' then 1 else 0 end) as has_poll_votes_admin_update_delete,
  sum(case when policyname = 'poll_votes_admin_delete' then 1 else 0 end) as has_poll_votes_admin_delete
from pg_policies
where schemaname = 'public'
  and tablename in ('contact_messages', 'polls', 'poll_options', 'poll_votes')
group by tablename
order by tablename;

-- ============================================================
-- 4) DATA SANITY: CONTACT INBOX
-- ============================================================
select
  count(*) as total_messages,
  count(*) filter (where coalesce(resolved, false) = false) as unresolved_messages,
  max(created_at) as latest_message_at
from public.contact_messages;

select
  id,
  created_at,
  resolved,
  left(coalesce(name, ''), 80) as name,
  left(coalesce(email, ''), 120) as email,
  left(coalesce(message, ''), 180) as message_preview
from public.contact_messages
order by created_at desc
limit 20;

-- ============================================================
-- 5) DATA SANITY: POLL VOTES + SUGGESTIONS
-- ============================================================
-- Suggestions available to admin (these are the ones shown in "Sugestii primite")
select
  id,
  poll_id,
  created_at,
  left(trim(suggestion), 200) as suggestion_preview
from public.poll_votes
where nullif(trim(coalesce(suggestion, '')), '') is not null
order by created_at desc
limit 100;

-- Any duplicate vote rows per (poll_id, user_id)? should be 0 rows
select
  poll_id,
  user_id,
  count(*) as c
from public.poll_votes
group by poll_id, user_id
having count(*) > 1;

-- Any invalid option relation? should be 0 rows
select
  pv.id as vote_id,
  pv.poll_id as vote_poll_id,
  pv.option_id,
  po.poll_id as option_poll_id
from public.poll_votes pv
left join public.poll_options po on po.id = pv.option_id
where pv.option_id is not null
  and (po.id is null or po.poll_id <> pv.poll_id)
limit 100;

-- votes_count consistency per option (delta should be 0 for all rows)
select
  po.id as option_id,
  po.poll_id,
  po.label,
  po.votes_count as stored_votes_count,
  count(pv.id)::int as computed_votes_count,
  (po.votes_count - count(pv.id)::int) as delta
from public.poll_options po
left join public.poll_votes pv on pv.option_id = po.id
group by po.id, po.poll_id, po.label, po.votes_count
having po.votes_count <> count(pv.id)::int
order by abs(po.votes_count - count(pv.id)::int) desc;

-- poll summary (quick dashboard for active + closed)
select
  p.id,
  p.status,
  p.question,
  p.allow_other,
  p.expires_at,
  count(distinct pv.id) as total_votes,
  count(distinct pv.id) filter (where nullif(trim(coalesce(pv.suggestion, '')), '') is not null) as votes_with_suggestion
from public.polls p
left join public.poll_votes pv on pv.poll_id = p.id
group by p.id, p.status, p.question, p.allow_other, p.expires_at
order by p.created_at desc
limit 50;

-- ============================================================
-- 6) OPTIONAL: QUICK FIX QUERY (run manually only if deltas exist)
-- ============================================================
-- Uncomment only if the consistency query above returned rows.
-- update public.poll_options po
-- set votes_count = v.cnt
-- from (
--   select po2.id, count(pv2.id)::int as cnt
--   from public.poll_options po2
--   left join public.poll_votes pv2 on pv2.option_id = po2.id
--   group by po2.id
-- ) v
-- where po.id = v.id;
