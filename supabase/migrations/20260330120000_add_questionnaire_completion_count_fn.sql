create or replace function public.count_active_submitted_questionnaire_users(
  p_questionnaire_version_id uuid
)
returns bigint
language sql
stable
set search_path = public
as $$
  select count(*)::bigint
  from (
    select distinct submission.user_id
    from public.questionnaire_submissions as submission
    join public.app_users as user_record
      on user_record.id = submission.user_id
    where submission.questionnaire_version_id = p_questionnaire_version_id
      and submission.status = 'submitted'
      and user_record.account_status <> 'deleted'
  ) as deduplicated_users;
$$;
