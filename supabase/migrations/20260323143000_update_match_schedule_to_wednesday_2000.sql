update public.app_configs
set value_json = '"每周三 20:00 统一公布结果。"'::jsonb,
    updated_at = now()
where config_key = 'match_schedule_text';

with recalculated as (
  select
    id,
    (
      (
        date_trunc('week', timezone('Asia/Shanghai', signup_end_at))
        + interval '2 days 20 hours'
        + case
            when timezone('Asia/Shanghai', signup_end_at)
              <= date_trunc('week', timezone('Asia/Shanghai', signup_end_at))
                + interval '2 days 20 hours'
            then interval '0 days'
            else interval '7 days'
          end
      ) at time zone 'Asia/Shanghai'
    ) as publish_at
  from public.match_batches
  where status = 'open'
)
update public.match_batches as batches
set match_run_at = recalculated.publish_at,
    result_publish_at = recalculated.publish_at,
    updated_at = now()
from recalculated
where batches.id = recalculated.id;
