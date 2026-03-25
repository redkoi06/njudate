begin;

alter table public.questionnaire_versions
  add column if not exists matching_policy_json jsonb;

update public.questionnaire_versions
set matching_policy_json = jsonb_build_object(
  'minimumPairScore', 60,
  'profileFilters', jsonb_build_array(
    jsonb_build_object(
      'field', 'gender',
      'mode', 'opposite_required'
    )
  ),
  'profileScoring', jsonb_build_array(
    jsonb_build_object('field', 'grade', 'mode', 'same_bonus', 'weight', 0.6),
    jsonb_build_object('field', 'department', 'mode', 'same_bonus', 'weight', 0.4),
    jsonb_build_object('field', 'campus', 'mode', 'same_bonus', 'weight', 0.2),
    jsonb_build_object('field', 'birth_year', 'mode', 'distance_penalty', 'maxGap', 4, 'weight', 0.5)
  ),
  'questionScoring', jsonb_build_object(
    'singleDefaultWeight', 1,
    'multipleDefaultWeight', 1.2,
    'scaleDefaultWeight', 1.5,
    'minimumComparableQuestions', 6
  )
)
where matching_policy_json is null;

alter table public.questionnaire_versions
  alter column matching_policy_json set not null;

alter table public.questionnaire_versions
  drop constraint if exists questionnaire_versions_matching_policy_object_check;

alter table public.questionnaire_versions
  add constraint questionnaire_versions_matching_policy_object_check
  check (jsonb_typeof(matching_policy_json) = 'object');

alter table public.questionnaire_questions
  disable trigger prevent_published_questions_change;

alter table public.questionnaire_sections
  disable trigger prevent_published_sections_change;

with text_questions as (
  select questionnaire_version_id, array_agg(question_code) as codes
  from public.questionnaire_questions
  where kind = 'text'
  group by questionnaire_version_id
)
update public.questionnaire_submissions as submission
set answers_json = coalesce(
  (
    select jsonb_object_agg(answer.key, answer.value)
    from jsonb_each(submission.answers_json) as answer
    where not (answer.key = any (text_questions.codes))
  ),
  '{}'::jsonb
)
from text_questions
where submission.questionnaire_version_id = text_questions.questionnaire_version_id;

delete from public.questionnaire_questions
where kind = 'text';

delete from public.questionnaire_sections as section
where not exists (
  select 1
  from public.questionnaire_questions as question
  where question.section_id = section.id
);

alter table public.questionnaire_questions
  add column if not exists weight numeric;

update public.questionnaire_questions
set weight = case kind
  when 'single' then 1
  when 'multiple' then 1.2
  when 'scale' then 1.5
  else 1
end
where weight is null;

alter table public.questionnaire_questions
  alter column weight set not null;

alter table public.questionnaire_questions
  drop constraint if exists questionnaire_questions_kind_check;

alter table public.questionnaire_questions
  drop constraint if exists questionnaire_questions_kind_shape_check;

alter table public.questionnaire_questions
  drop constraint if exists questionnaire_questions_weight_positive_check;

update public.questionnaire_questions
set placeholder = null
where placeholder is not null;

alter table public.questionnaire_questions
  enable trigger prevent_published_questions_change;

alter table public.questionnaire_sections
  enable trigger prevent_published_sections_change;

alter table public.questionnaire_questions
  add constraint questionnaire_questions_kind_check
  check (kind in ('single', 'multiple', 'scale'));

alter table public.questionnaire_questions
  add constraint questionnaire_questions_kind_shape_check
  check (
    (
      kind in ('single', 'multiple')
      and options_json is not null
      and jsonb_typeof(options_json) = 'array'
      and jsonb_array_length(options_json) >= 2
      and scale_min is null
      and scale_max is null
      and scale_left_label is null
      and scale_right_label is null
      and placeholder is null
    )
    or (
      kind = 'scale'
      and options_json is null
      and scale_min is not null
      and scale_max is not null
      and scale_min < scale_max
      and scale_left_label is not null
      and scale_right_label is not null
      and placeholder is null
    )
  );

alter table public.questionnaire_questions
  add constraint questionnaire_questions_weight_positive_check
  check (weight > 0);

alter table public.match_batches
  add column if not exists round_no integer,
  add column if not exists matching_policy_snapshot_json jsonb,
  add column if not exists last_error_message text;

with ordered_batches as (
  select id, row_number() over (order by signup_start_at, created_at, id) as generated_round_no
  from public.match_batches
)
update public.match_batches as batch
set round_no = ordered_batches.generated_round_no
from ordered_batches
where batch.id = ordered_batches.id
  and batch.round_no is null;

update public.match_batches as batch
set matching_policy_snapshot_json = version.matching_policy_json
from public.questionnaire_versions as version
where batch.questionnaire_version_id = version.id
  and batch.matching_policy_snapshot_json is null;

alter table public.match_batches
  alter column round_no set not null,
  alter column matching_policy_snapshot_json set not null;

alter table public.match_batches
  drop constraint if exists match_batches_status_check;

alter table public.match_batches
  drop constraint if exists match_batches_time_window_check;

alter table public.match_batches
  drop constraint if exists match_batches_matching_policy_snapshot_object_check;

with normalized_signup as (
  select
    id,
    signup_start_at,
    case
      when signup_end_at > signup_start_at then signup_end_at
      else signup_start_at + interval '1 minute'
    end as normalized_signup_end_at,
    match_run_at,
    result_publish_at
  from public.match_batches
),
normalized_match as (
  select
    id,
    signup_start_at,
    normalized_signup_end_at,
    case
      when match_run_at > normalized_signup_end_at then match_run_at
      else normalized_signup_end_at + interval '1 minute'
    end as normalized_match_run_at,
    result_publish_at
  from normalized_signup
),
normalized_result as (
  select
    id,
    normalized_signup_end_at,
    normalized_match_run_at,
    case
      when result_publish_at > normalized_match_run_at then result_publish_at
      else normalized_match_run_at + interval '1 minute'
    end as normalized_result_publish_at
  from normalized_match
)
update public.match_batches as batch
set signup_end_at = normalized_result.normalized_signup_end_at,
    match_run_at = normalized_result.normalized_match_run_at,
    result_publish_at = normalized_result.normalized_result_publish_at
from normalized_result
where batch.id = normalized_result.id
  and (
    batch.signup_end_at is distinct from normalized_result.normalized_signup_end_at
    or batch.match_run_at is distinct from normalized_result.normalized_match_run_at
    or batch.result_publish_at is distinct from normalized_result.normalized_result_publish_at
  );

alter table public.match_batches
  add constraint match_batches_status_check
  check (status in ('draft', 'open', 'locked', 'processing', 'published', 'failed'));

alter table public.match_batches
  add constraint match_batches_time_window_check
  check (
    signup_start_at < signup_end_at
    and signup_end_at < match_run_at
    and match_run_at < result_publish_at
  );

alter table public.match_batches
  add constraint match_batches_matching_policy_snapshot_object_check
  check (jsonb_typeof(matching_policy_snapshot_json) = 'object');

alter table public.match_batches
  add constraint match_batches_round_no_key unique (round_no);

create unique index if not exists questionnaire_versions_single_draft_idx
  on public.questionnaire_versions ((status))
  where status = 'draft';

create unique index if not exists match_batches_single_current_idx
  on public.match_batches ((true))
  where status in ('draft', 'open', 'locked', 'processing', 'failed');

create or replace function public.get_current_questionnaire_context()
returns table (
  questionnaire_version_id uuid,
  questionnaire_window_status text,
  batch_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_batch public.match_batches%rowtype;
begin
  select *
  into current_batch
  from public.match_batches
  where (
      status in ('open', 'locked', 'processing', 'failed')
    )
    or (
      status = 'published'
      and result_publish_at > now()
    )
  order by signup_end_at desc, created_at desc
  limit 1;

  if current_batch.id is not null then
    if current_batch.status = 'open' and current_batch.signup_end_at > now() then
      questionnaire_version_id := current_batch.questionnaire_version_id;
      questionnaire_window_status := 'open';
      batch_id := current_batch.id;
      return next;
      return;
    end if;

    if current_batch.result_publish_at > now() then
      questionnaire_version_id := current_batch.questionnaire_version_id;
      questionnaire_window_status := 'closed';
      batch_id := current_batch.id;
      return next;
      return;
    end if;
  end if;

  select id
  into questionnaire_version_id
  from public.questionnaire_versions
  where status = 'published'
  order by version_no desc
  limit 1;

  if questionnaire_version_id is null then
    raise exception 'No published questionnaire is available.'
      using errcode = '22023';
  end if;

  questionnaire_window_status := 'open';
  batch_id := null;
  return next;
end;
$$;

create or replace function public.validate_questionnaire_answers(
  p_questionnaire_version_id uuid,
  p_answers_json jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  question_record public.questionnaire_questions%rowtype;
  answer_value jsonb;
  option_value jsonb;
  option_ids text[];
  numeric_answer integer;
  multiple_count integer;
begin
  if p_answers_json is null or jsonb_typeof(p_answers_json) <> 'object' then
    raise exception 'Questionnaire answers must be a JSON object.'
      using errcode = '22023';
  end if;

  for question_record in
    select *
    from public.questionnaire_questions
    where questionnaire_version_id = p_questionnaire_version_id
    order by sort_order, created_at
  loop
    answer_value := p_answers_json -> question_record.question_code;

    if answer_value is null then
      if question_record.is_required then
        raise exception 'Missing answer for question "%".', question_record.question_code
          using errcode = '22023';
      end if;

      continue;
    end if;

    if question_record.kind = 'single' then
      if jsonb_typeof(answer_value) <> 'string' then
        raise exception 'Question "%" must select one option.', question_record.question_code
          using errcode = '22023';
      end if;

      select array_agg(option_item ->> 'id')
      into option_ids
      from jsonb_array_elements(question_record.options_json) as option_item;

      if not ((answer_value #>> '{}') = any (coalesce(option_ids, '{}'::text[]))) then
        raise exception 'Question "%" contains an invalid option id.', question_record.question_code
          using errcode = '22023';
      end if;
    elsif question_record.kind = 'multiple' then
      if jsonb_typeof(answer_value) <> 'array' then
        raise exception 'Question "%" must be an array of option ids.', question_record.question_code
          using errcode = '22023';
      end if;

      select array_agg(option_item ->> 'id')
      into option_ids
      from jsonb_array_elements(question_record.options_json) as option_item;

      select count(*)
      into multiple_count
      from jsonb_array_elements(answer_value);

      if question_record.is_required and multiple_count = 0 then
        raise exception 'Question "%" requires at least one option.', question_record.question_code
          using errcode = '22023';
      end if;

      for option_value in select * from jsonb_array_elements(answer_value)
      loop
        if jsonb_typeof(option_value) <> 'string' then
          raise exception 'Question "%" contains a non-string option id.', question_record.question_code
            using errcode = '22023';
        end if;

        if not ((option_value #>> '{}') = any (coalesce(option_ids, '{}'::text[]))) then
          raise exception 'Question "%" contains an invalid option id.', question_record.question_code
            using errcode = '22023';
        end if;
      end loop;
    elsif question_record.kind = 'scale' then
      if jsonb_typeof(answer_value) <> 'number' then
        raise exception 'Question "%" must be a numeric score.', question_record.question_code
          using errcode = '22023';
      end if;

      numeric_answer := (answer_value #>> '{}')::integer;

      if numeric_answer < question_record.scale_min or numeric_answer > question_record.scale_max then
        raise exception 'Question "%" is outside the allowed score range.', question_record.question_code
          using errcode = '22023';
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.save_questionnaire_draft(
  p_answers_json jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_version_id uuid;
  v_window_status text;
  v_draft_id uuid;
  v_existing_answers jsonb := '{}'::jsonb;
  v_next_submission_no integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if p_answers_json is null or jsonb_typeof(p_answers_json) <> 'object' then
    raise exception 'Draft answers must be a JSON object.'
      using errcode = '22023';
  end if;

  select questionnaire_version_id, questionnaire_window_status
  into v_version_id, v_window_status
  from public.get_current_questionnaire_context();

  if v_window_status <> 'open' then
    raise exception 'Questionnaire submission is currently closed.'
      using errcode = '22023';
  end if;

  select id, answers_json
  into v_draft_id, v_existing_answers
  from public.questionnaire_submissions
  where user_id = v_user_id
    and questionnaire_version_id = v_version_id
    and status = 'draft'
  limit 1;

  if v_draft_id is not null then
    update public.questionnaire_submissions
    set answers_json = v_existing_answers || p_answers_json
    where id = v_draft_id;

    return v_draft_id;
  end if;

  select answers_json
  into v_existing_answers
  from public.questionnaire_submissions
  where user_id = v_user_id
    and questionnaire_version_id = v_version_id
    and status = 'submitted'
  order by submission_no desc
  limit 1;

  select coalesce(max(submission_no), 0) + 1
  into v_next_submission_no
  from public.questionnaire_submissions
  where user_id = v_user_id
    and questionnaire_version_id = v_version_id;

  insert into public.questionnaire_submissions (
    user_id,
    questionnaire_version_id,
    submission_no,
    status,
    answers_json
  )
  values (
    v_user_id,
    v_version_id,
    v_next_submission_no,
    'draft',
    coalesce(v_existing_answers, '{}'::jsonb) || p_answers_json
  )
  returning id into v_draft_id;

  return v_draft_id;
end;
$$;

create or replace function public.submit_questionnaire(
  p_answers_json jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_version_id uuid;
  v_window_status text;
  v_draft_id uuid;
  v_current_answers jsonb := '{}'::jsonb;
  v_final_answers jsonb;
  v_next_submission_no integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if p_answers_json is null or jsonb_typeof(p_answers_json) <> 'object' then
    raise exception 'Submitted answers must be a JSON object.'
      using errcode = '22023';
  end if;

  select questionnaire_version_id, questionnaire_window_status
  into v_version_id, v_window_status
  from public.get_current_questionnaire_context();

  if v_window_status <> 'open' then
    raise exception 'Questionnaire submission is currently closed.'
      using errcode = '22023';
  end if;

  select id, answers_json
  into v_draft_id, v_current_answers
  from public.questionnaire_submissions
  where user_id = v_user_id
    and questionnaire_version_id = v_version_id
    and status = 'draft'
  limit 1;

  if v_draft_id is null then
    select answers_json
    into v_current_answers
    from public.questionnaire_submissions
    where user_id = v_user_id
      and questionnaire_version_id = v_version_id
      and status = 'submitted'
    order by submission_no desc
    limit 1;
  end if;

  v_final_answers := coalesce(v_current_answers, '{}'::jsonb) || p_answers_json;

  perform public.validate_questionnaire_answers(v_version_id, v_final_answers);

  if v_draft_id is not null then
    update public.questionnaire_submissions
    set status = 'submitted',
        answers_json = v_final_answers,
        submitted_at = now()
    where id = v_draft_id;

    return v_draft_id;
  end if;

  select coalesce(max(submission_no), 0) + 1
  into v_next_submission_no
  from public.questionnaire_submissions
  where user_id = v_user_id
    and questionnaire_version_id = v_version_id;

  insert into public.questionnaire_submissions (
    user_id,
    questionnaire_version_id,
    submission_no,
    status,
    answers_json,
    submitted_at
  )
  values (
    v_user_id,
    v_version_id,
    v_next_submission_no,
    'submitted',
    v_final_answers,
    now()
  )
  returning id into v_draft_id;

  return v_draft_id;
end;
$$;

commit;
