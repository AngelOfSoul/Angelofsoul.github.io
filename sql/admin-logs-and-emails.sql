-- Admin helpers: user emails + log deletion utilities
-- SAFE TO RE-RUN

-- 1) Admin email listing from auth.users (for accounts without family)
create or replace function public.admin_list_user_emails()
returns table(id uuid, email text)
language sql
security definer
set search_path = public, auth
as $$
  select u.id, u.email
  from auth.users u
  where exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  )
  order by u.created_at desc;
$$;

revoke all on function public.admin_list_user_emails() from public;
grant execute on function public.admin_list_user_emails() to authenticated;

-- 2) Admin can delete single log row
create or replace function public.admin_delete_log(p_log_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true) then
    raise exception 'forbidden';
  end if;

  delete from public.admin_logs where id = p_log_id;
  return true;
end;
$$;

revoke all on function public.admin_delete_log(uuid) from public;
grant execute on function public.admin_delete_log(uuid) to authenticated;

-- 3) Admin clear logs by scope: access | actions | all
create or replace function public.admin_clear_logs(p_scope text default 'all')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true) then
    raise exception 'forbidden';
  end if;

  if p_scope = 'access' then
    delete from public.admin_logs where action = 'access';
  elsif p_scope = 'actions' then
    delete from public.admin_logs where action <> 'access';
  else
    delete from public.admin_logs;
  end if;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.admin_clear_logs(text) from public;
grant execute on function public.admin_clear_logs(text) to authenticated;

-- 4) Optional direct DELETE policy on admin_logs (client-side delete)
do $$ begin
  create policy "admin delete admin_logs"
    on public.admin_logs for delete
    using (
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );
exception when duplicate_object then null; end $$;
