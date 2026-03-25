create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.upsert_auto_batch_lifecycle_schedule()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_name constant text := 'auto-batch-lifecycle-every-minute';
  v_project_url text;
  v_publishable_key text;
  v_request_url text;
  v_sql text;
begin
  perform cron.unschedule(job.jobid)
  from cron.job as job
  where job.jobname = v_job_name;

  select value_json #>> '{}'
  into v_project_url
  from public.app_configs
  where config_key = 'auto_batch_lifecycle_project_url'
  limit 1;

  select value_json #>> '{}'
  into v_publishable_key
  from public.app_configs
  where config_key = 'auto_batch_lifecycle_publishable_key'
  limit 1;

  if coalesce(v_project_url, '') = '' or coalesce(v_publishable_key, '') = '' then
    return false;
  end if;

  v_request_url :=
    format(
      '%s/functions/v1/auto-batch-lifecycle',
      rtrim(v_project_url, '/')
    );

  v_sql := format(
    $command$
      select
        net.http_post(
          url := %1$L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', %2$L
          ),
          body := '{}'::jsonb
        );
    $command$,
    v_request_url,
    format('Bearer %s', v_publishable_key)
  );

  perform cron.schedule(
    v_job_name,
    '* * * * *',
    v_sql
  );

  return true;
end;
$$;

select public.upsert_auto_batch_lifecycle_schedule();
