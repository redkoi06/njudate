drop trigger if exists handle_new_auth_user_after_insert on auth.users;

drop function if exists public.handle_new_auth_user();

create or replace function public.provision_current_app_user()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_confirmed_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select email_confirmed_at
  into v_email_confirmed_at
  from auth.users
  where id = v_user_id;

  if v_email_confirmed_at is null then
    raise exception 'Email confirmation required.'
      using errcode = '42501';
  end if;

  insert into public.app_users (id)
  values (v_user_id)
  on conflict (id) do nothing;

  return v_user_id;
end;
$$;

grant execute on function public.provision_current_app_user() to authenticated;
