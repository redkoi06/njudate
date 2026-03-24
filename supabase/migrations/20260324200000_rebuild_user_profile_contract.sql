alter table public.app_users
  add column campus text null,
  add column birth_year integer null;

update public.app_users
set nickname = null,
    gender = null,
    grade = null,
    department = null,
    campus = null,
    birth_year = null,
    updated_at = now();

update public.batch_participations
set profile_snapshot_json = '{}'::jsonb,
    updated_at = now();

update public.match_results
set counterpart_snapshot_json = null,
    updated_at = now();

update public.match_pairs
set contact_status = 'idle',
    contact_triggered_by = null,
    contact_triggered_at = null,
    contact_payload_json = null,
    contact_error = null,
    updated_at = now();

alter table public.app_users
  drop column major,
  drop column target_preference,
  drop column bio,
  drop column interests,
  drop column show_nickname;

create or replace function public.join_current_batch()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.app_users%rowtype;
  v_batch public.match_batches%rowtype;
  v_submission public.questionnaire_submissions%rowtype;
  v_participation_id uuid;
  v_snapshot jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select *
  into v_profile
  from public.app_users
  where id = v_user_id
    and deleted_at is null;

  if v_profile.id is null then
    raise exception 'User profile not found.'
      using errcode = '23503';
  end if;

  if v_profile.account_status <> 'active' then
    raise exception 'This account is not allowed to join the current batch.'
      using errcode = '42501';
  end if;

  if coalesce(btrim(v_profile.nickname), '') = ''
     or coalesce(btrim(v_profile.gender), '') = ''
     or coalesce(btrim(v_profile.grade), '') = ''
     or coalesce(btrim(v_profile.department), '') = ''
     or coalesce(btrim(v_profile.campus), '') = ''
     or v_profile.birth_year is null then
    raise exception 'Please complete your profile before joining the batch.'
      using errcode = '22023';
  end if;

  if v_profile.grade = '大一' then
    v_profile.department := '新生学院';
  end if;

  select *
  into v_batch
  from public.match_batches
  where status = 'open'
    and signup_start_at <= now()
    and signup_end_at >= now()
  order by signup_end_at
  limit 1;

  if v_batch.id is null then
    raise exception 'No open batch is currently available.'
      using errcode = '22023';
  end if;

  select *
  into v_submission
  from public.questionnaire_submissions
  where user_id = v_user_id
    and questionnaire_version_id = v_batch.questionnaire_version_id
    and status = 'submitted'
  order by submission_no desc
  limit 1;

  if v_submission.id is null then
    raise exception 'A submitted questionnaire is required before joining.'
      using errcode = '22023';
  end if;

  v_snapshot := jsonb_build_object(
    'nickname', v_profile.nickname,
    'gender', v_profile.gender,
    'grade', v_profile.grade,
    'department', v_profile.department,
    'campus', v_profile.campus,
    'birth_year', v_profile.birth_year
  );

  select id
  into v_participation_id
  from public.batch_participations
  where batch_id = v_batch.id
    and user_id = v_user_id
  limit 1;

  if v_participation_id is null then
    insert into public.batch_participations (
      batch_id,
      questionnaire_version_id,
      user_id,
      status,
      questionnaire_submission_id,
      profile_snapshot_json,
      joined_at
    )
    values (
      v_batch.id,
      v_batch.questionnaire_version_id,
      v_user_id,
      'joined',
      v_submission.id,
      v_snapshot,
      now()
    )
    returning id into v_participation_id;
  else
    update public.batch_participations
    set status = 'joined',
        questionnaire_submission_id = v_submission.id,
        profile_snapshot_json = v_snapshot,
        cancelled_at = null,
        joined_at = coalesce(joined_at, now())
    where id = v_participation_id
      and status <> 'locked';

    if not found then
      raise exception 'This batch is already locked.'
        using errcode = '55000';
    end if;
  end if;

  return v_participation_id;
end;
$$;
