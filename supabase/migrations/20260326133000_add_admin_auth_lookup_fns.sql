create or replace function public.get_auth_users_by_ids(p_user_ids uuid[])
returns table (
  user_id uuid,
  email text,
  banned_until timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    id as user_id,
    email::text,
    banned_until
  from auth.users
  where id = any(p_user_ids);
$$;

create or replace function public.find_auth_user_ids_by_email_keyword(p_keyword text)
returns table (user_id uuid)
language sql
security definer
set search_path = public
as $$
  select id as user_id
  from auth.users
  where lower(email) like lower('%' || p_keyword || '%');
$$;

grant execute on function public.get_auth_users_by_ids(uuid[]) to service_role;
grant execute on function public.find_auth_user_ids_by_email_keyword(text) to service_role;
