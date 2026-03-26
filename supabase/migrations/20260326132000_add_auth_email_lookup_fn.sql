create or replace function public.lookup_auth_user_by_email(p_email text)
returns table (
  user_id uuid,
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    id as user_id,
    email_confirmed_at
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;
$$;

grant execute on function public.lookup_auth_user_by_email(text) to authenticated;
