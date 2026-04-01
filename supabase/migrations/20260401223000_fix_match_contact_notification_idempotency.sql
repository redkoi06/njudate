with ranked_notifications as (
  select
    notification.id,
    row_number() over (
      partition by notification.user_id, notification.source_id
      order by
        case notification.email_status
          when 'sent' then 0
          when 'sending' then 1
          when 'pending' then 2
          when 'failed' then 3
          else 4
        end,
        case
          when notification.emailed_at is null then 1
          else 0
        end,
        notification.emailed_at asc nulls last,
        notification.created_at asc,
        notification.id asc
    ) as row_no
  from public.notifications as notification
  where notification.source_type = 'match_contact'
    and notification.source_id is not null
)
delete from public.notifications as notification
using ranked_notifications
where notification.id = ranked_notifications.id
  and ranked_notifications.row_no > 1;

create unique index if not exists notifications_match_contact_user_source_idx
  on public.notifications (user_id, source_id)
  where source_type = 'match_contact' and source_id is not null;

create or replace function public.claim_match_contact_notification_email(
  p_notification_id uuid,
  p_reclaim_before timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed_notification_id uuid;
begin
  update public.notifications as notification
  set email_status = 'sending',
      email_claimed_at = now()
  where notification.id = p_notification_id
    and notification.source_type = 'match_contact'
    and (
      notification.email_status in ('pending', 'failed')
      or (
        notification.email_status = 'sending'
        and notification.email_claimed_at is not null
        and p_reclaim_before is not null
        and notification.email_claimed_at <= p_reclaim_before
      )
    )
  returning notification.id into v_claimed_notification_id;

  return v_claimed_notification_id is not null;
end;
$$;

grant execute on function public.claim_match_contact_notification_email(uuid, timestamptz) to service_role;

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
  where id = p_match_pair_id
  for update;

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
