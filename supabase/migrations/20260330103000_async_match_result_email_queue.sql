alter table public.notifications
  add column if not exists email_claimed_at timestamptz null;

alter table public.notifications
  drop constraint if exists notifications_email_status_check;

alter table public.notifications
  add constraint notifications_email_status_check
  check (email_status in ('not_needed', 'pending', 'sending', 'sent', 'failed'));

create index if not exists notifications_match_result_source_idx
  on public.notifications (source_type, source_id)
  where source_type = 'match_result' and source_id is not null;

create index if not exists notifications_match_result_email_queue_idx
  on public.notifications (email_status, email_claimed_at, created_at, id)
  where source_type = 'match_result';

create or replace function public.claim_pending_match_result_email_notifications(
  p_limit integer,
  p_reclaim_before timestamptz
)
returns table (
  notification_id uuid,
  user_id uuid,
  title text,
  body text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if coalesce(p_limit, 0) <= 0 then
    return;
  end if;

  return query
  with claimed as (
    select notification.id
    from public.notifications as notification
    where notification.source_type = 'match_result'
      and (
        notification.email_status = 'pending'
        or (
          notification.email_status = 'sending'
          and notification.email_claimed_at is not null
          and p_reclaim_before is not null
          and notification.email_claimed_at <= p_reclaim_before
        )
      )
    order by notification.created_at asc, notification.id asc
    limit p_limit
    for update skip locked
  ),
  updated as (
    update public.notifications as notification
    set email_status = 'sending',
        email_claimed_at = v_now
    from claimed
    where notification.id = claimed.id
    returning
      notification.id,
      notification.user_id,
      notification.title,
      notification.body
  )
  select
    updated.id as notification_id,
    updated.user_id,
    updated.title,
    updated.body
  from updated;
end;
$$;

grant execute on function public.claim_pending_match_result_email_notifications(integer, timestamptz) to service_role;
