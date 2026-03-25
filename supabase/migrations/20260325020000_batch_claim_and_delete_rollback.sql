begin;

drop function if exists public.delete_my_account();

create function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.app_users%rowtype;
  v_blocking_batch_id uuid;
  v_cancelled_participation_ids uuid[] := '{}'::uuid[];
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

  with cancelled_participations as (
    update public.batch_participations as participation
    set status = 'cancelled',
        cancelled_at = now()
    from public.match_batches as batch
    where participation.batch_id = batch.id
      and participation.user_id = v_user_id
      and participation.status = 'joined'
      and batch.status = 'open'
    returning participation.id
  )
  select coalesce(array_agg(id), '{}'::uuid[])
  into v_cancelled_participation_ids
  from cancelled_participations;

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
      'cancelled_participation_ids', to_jsonb(v_cancelled_participation_ids),
      'deleted_at', now()
    )
  );

  return jsonb_build_object(
    'userId', v_user_id,
    'cancelledParticipationIds', to_jsonb(v_cancelled_participation_ids)
  );
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.rollback_delete_my_account(
  p_user_id uuid,
  p_cancelled_participation_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.app_users%rowtype;
  v_expected_restore_count integer :=
    coalesce(array_length(coalesce(p_cancelled_participation_ids, '{}'::uuid[]), 1), 0);
  v_restored_count integer := 0;
begin
  if p_user_id is null then
    raise exception '缺少待回滚的用户。'
      using errcode = '22023';
  end if;

  select *
  into v_profile
  from public.app_users
  where id = p_user_id
  for update;

  if v_profile.id is null then
    raise exception '账号不存在。'
      using errcode = '23503';
  end if;

  if v_expected_restore_count > 0 then
    with restored_participations as (
      update public.batch_participations as participation
      set status = 'joined',
          cancelled_at = null
      from public.match_batches as batch
      where participation.batch_id = batch.id
        and participation.user_id = p_user_id
        and participation.id = any (coalesce(p_cancelled_participation_ids, '{}'::uuid[]))
        and participation.status = 'cancelled'
        and batch.status = 'open'
      returning participation.id
    )
    select count(*)
    into v_restored_count
    from restored_participations;

    if v_restored_count <> v_expected_restore_count then
      raise exception '删号回滚失败：open 批次报名恢复不完整。'
        using errcode = '55000';
    end if;
  end if;

  update public.app_users
  set account_status = 'active',
      account_status_reason = null,
      deleted_at = null
  where id = p_user_id;

  return p_user_id;
end;
$$;

revoke all on function public.rollback_delete_my_account(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.rollback_delete_my_account(uuid, uuid[]) to service_role;

commit;
