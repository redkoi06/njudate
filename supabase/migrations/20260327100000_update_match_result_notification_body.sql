create or replace function public.publish_match_batch(
  p_batch_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.match_batches%rowtype;
  v_now timestamptz := now();
begin
  select *
  into v_batch
  from public.match_batches
  where id = p_batch_id
  for update;

  if v_batch.id is null then
    raise exception '批次不存在。'
      using errcode = '23503';
  end if;

  if v_batch.status = 'published' then
    raise exception '已发布批次不能重复发布。'
      using errcode = '55000';
  end if;

  if v_batch.status <> 'processing' then
    raise exception '只有 processing 批次可以发布结果。'
      using errcode = '55000';
  end if;

  update public.match_results
  set released_at = v_now
  where batch_id = p_batch_id
    and released_at is null;

  insert into public.notifications (
    user_id,
    category,
    title,
    body,
    level,
    source_type,
    source_id,
    email_status
  )
  select
    result.user_id,
    'match_result',
    '第 ' || v_batch.round_no || ' 轮匹配结果已发布',
    '访问“匹配记录”查看匹配结果吧！',
    case
      when result.status = 'matched' then 'success'
      else 'info'
    end,
    'match_result',
    result.id,
    case
      when user_record.notify_match_result then 'pending'
      else 'not_needed'
    end
  from public.match_results as result
  join public.app_users as user_record
    on user_record.id = result.user_id
  left join public.notifications as notification
    on notification.source_type = 'match_result'
    and notification.source_id = result.id
  where result.batch_id = p_batch_id
    and notification.id is null;

  update public.match_batches
  set status = 'published',
      published_at = v_now,
      last_error_message = null
  where id = p_batch_id;

  insert into public.operation_logs (
    actor_role,
    action_type,
    entity_type,
    entity_id,
    payload_json
  )
  values (
    'system',
    'batch_published',
    'match_batch',
    v_batch.id,
    jsonb_build_object(
      'published_at', v_now,
      'round_no', v_batch.round_no
    )
  );

  return p_batch_id;
end;
$$;
