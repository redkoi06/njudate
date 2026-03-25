create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  v_job_name constant text := 'auto-batch-lifecycle-every-minute';
begin
  perform cron.unschedule(job.jobid)
  from cron.job as job
  where job.jobname = v_job_name;
end;
$$;

drop function if exists public.upsert_auto_batch_lifecycle_schedule();
drop function if exists public.upsert_auto_batch_lifecycle_schedule(text, text);

delete from public.app_configs
where config_key in (
  'auto_batch_lifecycle_project_url',
  'auto_batch_lifecycle_publishable_key'
);

create or replace function public.upsert_auto_batch_lifecycle_schedule(
  project_url text,
  cron_secret text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_name constant text := 'auto-batch-lifecycle-every-minute';
  v_request_url text;
  v_sql text;
begin
  perform cron.unschedule(job.jobid)
  from cron.job as job
  where job.jobname = v_job_name;

  if coalesce(project_url, '') = '' or coalesce(cron_secret, '') = '' then
    return false;
  end if;

  v_request_url :=
    format(
      '%s/functions/v1/auto-batch-lifecycle',
      rtrim(project_url, '/')
    );

  v_sql := format(
    $command$
      select
        net.http_post(
          url := %1$L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', %2$L
          ),
          body := '{}'::jsonb
        );
    $command$,
    v_request_url,
    cron_secret
  );

  perform cron.schedule(
    v_job_name,
    '* * * * *',
    v_sql
  );

  return true;
end;
$$;
