create or replace function public.get_allowed_email_domains()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(value order by ord)
      from public.app_configs config
      cross join lateral jsonb_array_elements_text(config.value_json) with ordinality as domains(value, ord)
      where config_key = 'allowed_email_domains'
    ),
    array['smail.nju.edu.cn', 'qq.com']::text[]
  );
$$;

update public.app_configs
set value_json = '["smail.nju.edu.cn", "qq.com"]'::jsonb,
    description = 'Approved email domains.',
    updated_at = now()
where config_key = 'allowed_email_domains';
