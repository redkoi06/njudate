with target_batch as (
  select
    id,
    code,
    label,
    status,
    round_no,
    signup_start_at,
    signup_end_at,
    match_run_at,
    result_publish_at,
    processed_at,
    published_at,
    matching_policy_snapshot_json
  from public.match_batches
  where code = 'batch-202614'
  limit 1
),
status_counts as (
  select
    r.status,
    count(*) as cnt
  from public.match_results r
  join target_batch b on b.id = r.batch_id
  group by r.status
),
user_results as (
  select
    au.email,
    r.status,
    r.score,
    r.released_at
  from public.match_results r
  join auth.users au on au.id = r.user_id
  join target_batch b on b.id = r.batch_id
  order by r.status, au.email
),
pair_results as (
  select
    l.email as left_email,
    r.email as right_email,
    mp.contact_status,
    mp.created_at
  from public.match_pairs mp
  join auth.users l on l.id = mp.left_user_id
  join auth.users r on r.id = mp.right_user_id
  join target_batch b on b.id = mp.batch_id
  order by left_email, right_email
)
select jsonb_build_object(
  'batch', (select to_jsonb(tb) from target_batch tb),
  'status_counts', coalesce(
    (select jsonb_agg(to_jsonb(sc) order by sc.status) from status_counts sc),
    '[]'::jsonb
  ),
  'user_results', coalesce(
    (select jsonb_agg(to_jsonb(ur)) from user_results ur),
    '[]'::jsonb
  ),
  'pair_results', coalesce(
    (select jsonb_agg(to_jsonb(pr)) from pair_results pr),
    '[]'::jsonb
  )
) as snapshot;
