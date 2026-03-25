begin;

update public.app_users
set account_status = 'deleted',
    account_status_reason = coalesce(account_status_reason, 'legacy_delete_requested_migrated'),
    deleted_at = coalesce(deleted_at, now())
where account_status = 'delete_requested';

alter table public.app_users
  drop constraint if exists app_users_account_status_check;

alter table public.app_users
  add constraint app_users_account_status_check
  check (account_status in ('active', 'restricted', 'deleted'));

drop policy if exists "match_results_read_self_or_admin"
on public.match_results;

create policy "match_results_read_self_or_admin"
on public.match_results
for select
to authenticated
using (
  public.is_admin()
  or (
    user_id = auth.uid()
    and released_at is not null
    and exists (
      select 1
      from public.match_batches as batch
      where batch.id = match_results.batch_id
        and batch.status = 'published'
    )
  )
);

drop policy if exists "notifications_read_self_or_admin"
on public.notifications;

create policy "notifications_read_self_or_admin"
on public.notifications
for select
to authenticated
using (
  public.is_admin()
  or (
    user_id = auth.uid()
    and (
      source_type <> 'match_result'
      or exists (
        select 1
        from public.match_results as result
        join public.match_batches as batch
          on batch.id = result.batch_id
        where result.id = notifications.source_id
          and result.user_id = auth.uid()
          and result.released_at is not null
          and batch.status = 'published'
      )
    )
  )
);

create or replace function public.mark_match_result_viewed(
  p_match_result_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception '需要先登录。'
      using errcode = '42501';
  end if;

  update public.match_results as result
  set viewed_at = coalesce(result.viewed_at, now())
  from public.match_batches as batch
  where result.id = p_match_result_id
    and result.user_id = v_user_id
    and result.batch_id = batch.id
    and result.released_at is not null
    and batch.status = 'published'
  returning result.id into p_match_result_id;

  if p_match_result_id is null then
    raise exception '匹配结果尚未发布或不存在。'
      using errcode = '23503';
  end if;

  return p_match_result_id;
end;
$$;

create or replace function public.trigger_match_contact(
  p_match_pair_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_pair_record public.match_pairs%rowtype;
  v_left_email text;
  v_right_email text;
  v_left_nickname text;
  v_right_nickname text;
  v_payload jsonb;
begin
  if v_user_id is null then
    raise exception '需要先登录。'
      using errcode = '42501';
  end if;

  select *
  into v_pair_record
  from public.match_pairs
  where id = p_match_pair_id;

  if v_pair_record.id is null then
    raise exception '匹配对不存在。'
      using errcode = '23503';
  end if;

  if v_user_id not in (v_pair_record.left_user_id, v_pair_record.right_user_id) then
    raise exception '你无权操作这条匹配。'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.match_results as result
    join public.match_batches as batch
      on batch.id = result.batch_id
    where result.match_pair_id = v_pair_record.id
      and result.user_id = v_user_id
      and result.released_at is not null
      and batch.status = 'published'
  ) then
    raise exception '匹配结果尚未发布。'
      using errcode = '42501';
  end if;

  if v_pair_record.contact_triggered_at is not null then
    return v_pair_record.contact_payload_json;
  end if;

  select email
  into v_left_email
  from auth.users
  where id = v_pair_record.left_user_id;

  select email
  into v_right_email
  from auth.users
  where id = v_pair_record.right_user_id;

  select nickname
  into v_left_nickname
  from public.app_users
  where id = v_pair_record.left_user_id;

  select nickname
  into v_right_nickname
  from public.app_users
  where id = v_pair_record.right_user_id;

  v_payload := jsonb_build_object(
    'left_user', jsonb_build_object(
      'user_id', v_pair_record.left_user_id,
      'nickname', v_left_nickname,
      'email', v_left_email
    ),
    'right_user', jsonb_build_object(
      'user_id', v_pair_record.right_user_id,
      'nickname', v_right_nickname,
      'email', v_right_email
    ),
    'triggered_at', now()
  );

  update public.match_pairs
  set contact_status = 'completed',
      contact_triggered_by = v_user_id,
      contact_triggered_at = now(),
      contact_payload_json = v_payload,
      contact_error = null
  where id = v_pair_record.id;

  insert into public.operation_logs (
    actor_user_id,
    actor_role,
    target_user_id,
    action_type,
    entity_type,
    entity_id,
    payload_json
  )
  values (
    v_user_id,
    'user',
    case
      when v_user_id = v_pair_record.left_user_id then v_pair_record.right_user_id
      else v_pair_record.left_user_id
    end,
    'contact_triggered',
    'match_pair',
    v_pair_record.id,
    v_payload
  );

  return v_payload;
end;
$$;

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
    '本周匹配结果已发布',
    case
      when result.status = 'matched'
        then '你的本周匹配结果已经发布，进入站内即可查看理由并决定是否联系。'
      else '你的本周匹配结果已经发布，本轮暂未形成匹配。'
    end,
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
    p_batch_id,
    jsonb_build_object(
      'published_at', v_now
    )
  );

  return p_batch_id;
end;
$$;

revoke all on function public.publish_match_batch(uuid) from public, anon, authenticated;
grant execute on function public.publish_match_batch(uuid) to service_role;

create or replace function public.delete_my_account()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.app_users%rowtype;
  v_blocking_batch_id uuid;
begin
  if v_user_id is null then
    raise exception '需要先登录。'
      using errcode = '42501';
  end if;

  select *
  into v_profile
  from public.app_users
  where id = v_user_id
    and deleted_at is null
  for update;

  if v_profile.id is null then
    raise exception '账号不存在。'
      using errcode = '23503';
  end if;

  if v_profile.account_status = 'deleted' then
    raise exception '账号已删除。'
      using errcode = '22023';
  end if;

  if v_profile.role = 'admin' then
    raise exception '管理员账号不支持自助删除。'
      using errcode = '42501';
  end if;

  select batch.id
  into v_blocking_batch_id
  from public.match_batches as batch
  join public.batch_participations as participation
    on participation.batch_id = batch.id
  where participation.user_id = v_user_id
    and participation.status = 'locked'
    and batch.status in ('locked', 'processing', 'failed')
  order by batch.signup_end_at desc, batch.created_at desc
  limit 1;

  if v_blocking_batch_id is not null then
    raise exception '当前轮次已锁定或正在处理中，请等待结果发布后再删除账号。'
      using errcode = '55000';
  end if;

  update public.batch_participations as participation
  set status = 'cancelled',
      cancelled_at = now()
  from public.match_batches as batch
  where participation.batch_id = batch.id
    and participation.user_id = v_user_id
    and participation.status = 'joined'
    and batch.status = 'open';

  update public.app_users
  set account_status = 'deleted',
      account_status_reason = 'user_self_deleted',
      deleted_at = coalesce(deleted_at, now())
  where id = v_user_id;

  insert into public.operation_logs (
    actor_user_id,
    actor_role,
    target_user_id,
    action_type,
    entity_type,
    entity_id,
    payload_json
  )
  values (
    v_user_id,
    'user',
    v_user_id,
    'account_deleted',
    'app_user',
    v_user_id,
    jsonb_build_object(
      'deleted_at', now()
    )
  );

  return v_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

drop function if exists public.create_service_request(text, text, text, text, text, text);
drop table if exists public.service_requests cascade;

commit;
