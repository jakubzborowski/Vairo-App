-- Quick fix: RLS blocked client inserts into profiles.
-- Run once in Supabase → SQL Editor.

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, email, onboarding_step)
  values (
    uid,
    (select email from auth.users where id = uid),
    'name'
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email)
  returning * into result;

  if result.id is null then
    select * into result from public.profiles where id = uid;
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

-- Backfill missing profiles for existing auth users
insert into public.profiles (id, email, onboarding_step)
select u.id, u.email, 'name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
