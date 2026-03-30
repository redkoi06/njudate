-- Export current matching strategy and verification evidence for one batch.
-- Update the batch code in each WHERE clause when needed.

-- 1) Batch policy snapshot and lifecycle times.
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
where code = 'batch-202614';

-- 2) Matched vs unmatched distribution.
select
  r.status,
  count(*) as cnt
from public.match_results r
join public.match_batches b on b.id = r.batch_id
where b.code = 'batch-202614'
group by r.status
order by r.status;

-- 3) User-level visibility evidence.
select
  au.email,
  r.status,
  r.score,
  r.released_at
from public.match_results r
join auth.users au on au.id = r.user_id
join public.match_batches b on b.id = r.batch_id
where b.code = 'batch-202614'
order by r.status, au.email;

-- 4) Pair-level evidence.
select
  l.email as left_email,
  r.email as right_email,
  mp.contact_status,
  mp.created_at
from public.match_pairs mp
join auth.users l on l.id = mp.left_user_id
join auth.users r on r.id = mp.right_user_id
join public.match_batches b on b.id = mp.batch_id
where b.code = 'batch-202614'
order by left_email, right_email;
