begin;

insert into public.app_configs (config_key, value_json, description)
values (
  'allowed_email_domains',
  '["smail.nju.edu.cn", "njudate.cn"]'::jsonb,
  'Approved school email domains.'
)
on conflict (config_key) do update
set value_json = excluded.value_json,
    description = excluded.description,
    updated_at = now();

create or replace function public.get_allowed_email_domains()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(lower(value))
      from (
        select jsonb_array_elements_text(value_json) as value
        from public.app_configs
        where config_key = 'allowed_email_domains'
      ) domains
    ),
    array['smail.nju.edu.cn', 'njudate.cn']::text[]
  );
$$;

commit;
