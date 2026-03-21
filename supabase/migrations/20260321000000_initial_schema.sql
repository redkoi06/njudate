create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

create table public.app_configs (
  config_key text primary key,
  value_json jsonb not null,
  description text not null,
  updated_by uuid null,
  updated_at timestamptz not null default now()
);

create table public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  account_status text not null default 'active' check (
    account_status in ('active', 'restricted', 'delete_requested', 'deleted')
  ),
  account_status_reason text null,
  nickname text null,
  department text null,
  major text null,
  grade text null,
  gender text null,
  target_preference text null,
  bio text null,
  interests text[] not null default '{}'::text[],
  show_nickname boolean not null default false,
  notify_match_result boolean not null default true,
  notify_weekly_reminder boolean not null default true,
  notify_platform_digest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

alter table public.app_configs
  add constraint app_configs_updated_by_fkey
  foreign key (updated_by)
  references public.app_users (id)
  on delete set null;

create table public.questionnaire_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  version_no integer not null,
  status text not null check (status in ('draft', 'published', 'archived')),
  title text not null,
  description text not null,
  created_by uuid null references public.app_users (id) on delete set null,
  published_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionnaire_versions_version_no_key unique (version_no)
);

create unique index questionnaire_versions_single_published_idx
  on public.questionnaire_versions ((status))
  where status = 'published';

create table public.questionnaire_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  questionnaire_version_id uuid not null references public.questionnaire_versions (id) on delete cascade,
  code text not null,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionnaire_sections_version_code_key unique (questionnaire_version_id, code),
  constraint questionnaire_sections_id_version_key unique (id, questionnaire_version_id)
);

create table public.questionnaire_questions (
  id uuid primary key default extensions.gen_random_uuid(),
  questionnaire_version_id uuid not null references public.questionnaire_versions (id) on delete cascade,
  section_id uuid not null references public.questionnaire_sections (id) on delete cascade,
  question_code text not null,
  kind text not null check (kind in ('text', 'single', 'multiple', 'scale')),
  prompt text not null,
  helper_text text null,
  placeholder text null,
  is_required boolean not null default true,
  options_json jsonb null,
  scale_min integer null,
  scale_max integer null,
  scale_left_label text null,
  scale_right_label text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionnaire_questions_version_code_key unique (questionnaire_version_id, question_code),
  constraint questionnaire_questions_section_version_fkey
    foreign key (section_id, questionnaire_version_id)
    references public.questionnaire_sections (id, questionnaire_version_id)
    on delete cascade,
  constraint questionnaire_questions_kind_shape_check check (
    (
      kind in ('single', 'multiple')
      and options_json is not null
      and jsonb_typeof(options_json) = 'array'
      and scale_min is null
      and scale_max is null
      and scale_left_label is null
      and scale_right_label is null
    )
    or (
      kind = 'scale'
      and options_json is null
      and scale_min is not null
      and scale_max is not null
      and scale_min < scale_max
      and scale_left_label is not null
      and scale_right_label is not null
    )
    or (
      kind = 'text'
      and options_json is null
      and scale_min is null
      and scale_max is null
      and scale_left_label is null
      and scale_right_label is null
    )
  )
);

create table public.questionnaire_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  questionnaire_version_id uuid not null references public.questionnaire_versions (id) on delete cascade,
  submission_no integer not null,
  status text not null check (status in ('draft', 'submitted')),
  answers_json jsonb not null default '{}'::jsonb,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionnaire_submissions_answers_object_check check (jsonb_typeof(answers_json) = 'object'),
  constraint questionnaire_submissions_user_version_no_key unique (user_id, questionnaire_version_id, submission_no),
  constraint questionnaire_submissions_id_user_version_key unique (id, user_id, questionnaire_version_id)
);

create unique index questionnaire_submissions_single_draft_idx
  on public.questionnaire_submissions (user_id, questionnaire_version_id)
  where status = 'draft';

create table public.match_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null,
  label text not null,
  questionnaire_version_id uuid not null references public.questionnaire_versions (id),
  signup_start_at timestamptz not null,
  signup_end_at timestamptz not null,
  match_run_at timestamptz not null,
  result_publish_at timestamptz not null,
  status text not null check (
    status in ('draft', 'open', 'locked', 'processing', 'published', 'cancelled', 'failed')
  ),
  paused_reason text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz null,
  published_at timestamptz null,
  constraint match_batches_code_key unique (code),
  constraint match_batches_id_questionnaire_key unique (id, questionnaire_version_id),
  constraint match_batches_time_window_check check (
    signup_start_at < signup_end_at
    and signup_end_at <= match_run_at
    and match_run_at <= result_publish_at
  )
);

create table public.batch_participations (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.match_batches (id) on delete cascade,
  questionnaire_version_id uuid not null references public.questionnaire_versions (id),
  user_id uuid not null references public.app_users (id) on delete cascade,
  status text not null check (status in ('joined', 'cancelled', 'locked')),
  questionnaire_submission_id uuid not null references public.questionnaire_submissions (id) on delete restrict,
  profile_snapshot_json jsonb not null,
  joined_at timestamptz null,
  cancelled_at timestamptz null,
  locked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batch_participations_snapshot_object_check check (
    jsonb_typeof(profile_snapshot_json) = 'object'
  ),
  constraint batch_participations_batch_user_key unique (batch_id, user_id),
  constraint batch_participations_id_batch_user_key unique (id, batch_id, user_id),
  constraint batch_participations_batch_questionnaire_fkey
    foreign key (batch_id, questionnaire_version_id)
    references public.match_batches (id, questionnaire_version_id)
    on delete cascade,
  constraint batch_participations_submission_user_version_fkey
    foreign key (questionnaire_submission_id, user_id, questionnaire_version_id)
    references public.questionnaire_submissions (id, user_id, questionnaire_version_id)
    on delete restrict
);

create table public.match_pairs (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.match_batches (id) on delete cascade,
  left_participation_id uuid not null references public.batch_participations (id) on delete cascade,
  right_participation_id uuid not null references public.batch_participations (id) on delete cascade,
  left_user_id uuid not null references public.app_users (id) on delete cascade,
  right_user_id uuid not null references public.app_users (id) on delete cascade,
  contact_status text not null default 'idle' check (
    contact_status in ('idle', 'confirming', 'triggered', 'failed', 'completed')
  ),
  contact_triggered_by uuid null references public.app_users (id) on delete set null,
  contact_triggered_at timestamptz null,
  contact_payload_json jsonb null,
  contact_error text null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_pairs_left_right_distinct_check check (left_participation_id <> right_participation_id),
  constraint match_pairs_left_right_order_check check (left_participation_id::text < right_participation_id::text),
  constraint match_pairs_left_right_user_distinct_check check (left_user_id <> right_user_id),
  constraint match_pairs_contact_payload_shape_check check (
    contact_payload_json is null or jsonb_typeof(contact_payload_json) = 'object'
  ),
  constraint match_pairs_contact_triggered_by_valid_check check (
    contact_triggered_by is null or contact_triggered_by in (left_user_id, right_user_id)
  ),
  constraint match_pairs_left_participation_key unique (batch_id, left_participation_id),
  constraint match_pairs_right_participation_key unique (batch_id, right_participation_id)
);

create table public.match_results (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.match_batches (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  participation_id uuid not null references public.batch_participations (id) on delete cascade,
  match_pair_id uuid null references public.match_pairs (id) on delete set null,
  status text not null check (status in ('pending', 'matched', 'unmatched', 'error', 'expired')),
  counterpart_snapshot_json jsonb null,
  score integer null check (score is null or (score between 0 and 100)),
  preview_text text null,
  reasons text[] null,
  shared_signals text[] null,
  released_at timestamptz null,
  viewed_at timestamptz null,
  error_detail text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_results_counterpart_snapshot_shape_check check (
    counterpart_snapshot_json is null or jsonb_typeof(counterpart_snapshot_json) = 'object'
  ),
  constraint match_results_batch_user_key unique (batch_id, user_id),
  constraint match_results_participation_batch_user_fkey
    foreign key (participation_id, batch_id, user_id)
    references public.batch_participations (id, batch_id, user_id)
    on delete cascade,
  constraint match_results_status_shape_check check (
    (
      status in ('matched', 'expired')
      and match_pair_id is not null
      and counterpart_snapshot_json is not null
      and score is not null
      and coalesce(cardinality(reasons), 0) between 3 and 5
    )
    or (
      status in ('pending', 'unmatched', 'error')
      and match_pair_id is null
    )
  )
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  level text not null default 'info' check (level in ('info', 'success', 'warning')),
  is_read boolean not null default false,
  read_at timestamptz null,
  email_status text not null default 'not_needed' check (
    email_status in ('not_needed', 'pending', 'sent', 'failed')
  ),
  emailed_at timestamptz null,
  source_type text not null,
  source_id uuid null,
  created_at timestamptz not null default now(),
  constraint notifications_read_state_check check (
    (is_read and read_at is not null) or (not is_read and read_at is null)
  )
);

create table public.announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  body text not null,
  eyebrow text not null,
  audience text not null check (audience in ('public', 'user', 'admin', 'all')),
  status text not null check (status in ('draft', 'published', 'archived')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid null references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  archived_at timestamptz null,
  constraint announcements_time_window_check check (starts_at < ends_at)
);

create table public.service_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  request_type text not null check (
    request_type in ('consultation', 'report', 'export_data', 'delete_account')
  ),
  user_id uuid null references public.app_users (id) on delete set null,
  sender_name text null,
  sender_email text not null,
  topic text null,
  message text null,
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  status text not null default 'open' check (status in ('open', 'processing', 'resolved', 'closed')),
  admin_reply text null,
  internal_note text null,
  handled_by uuid null references public.app_users (id) on delete set null,
  handled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table public.operation_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid null references public.app_users (id) on delete set null,
  actor_role text not null,
  target_user_id uuid null references public.app_users (id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid null,
  payload_json jsonb null,
  created_at timestamptz not null default now()
);

create index operation_logs_actor_idx on public.operation_logs (actor_user_id, created_at desc);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index match_results_user_created_idx on public.match_results (user_id, created_at desc);
create index service_requests_user_created_idx on public.service_requests (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where id = auth.uid()
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select email
  from auth.users
  where id = auth.uid();
$$;

create or replace function public.get_allowed_email_domains()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(lower(value))
      from (
        select jsonb_array_elements_text(value_json) as value
        from public.app_configs
        where config_key = 'allowed_email_domains'
      ) domains
    ),
    array['smail.nju.edu.cn', 'qq.com']::text[]
  );
$$;

create or replace function public.enforce_allowed_auth_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  allowed_domains text[] := public.get_allowed_email_domains();
  email_domain text := lower(split_part(coalesce(new.email, ''), '@', 2));
begin
  if new.email is null or email_domain = '' or not (email_domain = any (allowed_domains)) then
    raise exception 'Only approved email domains are allowed.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.app_users (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.prevent_published_questionnaire_content_change()
returns trigger
language plpgsql
as $$
declare
  version_id uuid;
begin
  version_id := case
    when tg_op = 'DELETE' then old.questionnaire_version_id
    else new.questionnaire_version_id
  end;

  if exists (
    select 1
    from public.questionnaire_versions
    where id = version_id
      and status = 'published'
  ) then
    raise exception 'Published questionnaire content cannot be changed.'
      using errcode = '55000';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.restrict_app_user_self_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.id <> auth.uid() then
    raise exception 'You cannot update another user profile.'
      using errcode = '42501';
  end if;

  if new.id <> old.id
     or new.role <> old.role
     or new.account_status <> old.account_status
     or new.account_status_reason is distinct from old.account_status_reason
     or new.deleted_at is distinct from old.deleted_at
     or new.created_at <> old.created_at then
    raise exception 'Restricted profile fields cannot be changed.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_submitted_submission_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'submitted' then
    raise exception 'Submitted questionnaire records cannot be modified.'
      using errcode = '55000';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.validate_match_batch_questionnaire_lock()
returns trigger
language plpgsql
as $$
declare
  is_published_version boolean;
begin
  if tg_op = 'UPDATE'
     and old.status <> 'draft'
     and new.questionnaire_version_id <> old.questionnaire_version_id then
    raise exception 'Batch questionnaire version cannot change after leaving draft.'
      using errcode = '55000';
  end if;

  if new.status <> 'draft' then
    select exists (
      select 1
      from public.questionnaire_versions
      where id = new.questionnaire_version_id
        and status in ('published', 'archived')
    )
    into is_published_version;

    if not is_published_version then
      raise exception 'Active batches must point to a published questionnaire version.'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_match_pair_integrity()
returns trigger
language plpgsql
as $$
declare
  left_record public.batch_participations%rowtype;
  right_record public.batch_participations%rowtype;
begin
  select *
  into left_record
  from public.batch_participations
  where id = new.left_participation_id;

  select *
  into right_record
  from public.batch_participations
  where id = new.right_participation_id;

  if left_record.id is null or right_record.id is null then
    raise exception 'Both participations must exist.'
      using errcode = '23503';
  end if;

  if left_record.batch_id <> new.batch_id or right_record.batch_id <> new.batch_id then
    raise exception 'Both participations must belong to the same batch.'
      using errcode = '22023';
  end if;

  if left_record.user_id <> new.left_user_id or right_record.user_id <> new.right_user_id then
    raise exception 'Pair user ids must match participation user ids.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.match_pairs existing_pair
    where existing_pair.batch_id = new.batch_id
      and existing_pair.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (
        existing_pair.left_participation_id in (new.left_participation_id, new.right_participation_id)
        or existing_pair.right_participation_id in (new.left_participation_id, new.right_participation_id)
      )
  ) then
    raise exception 'A participation can only appear in one pair per batch.'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

create or replace function public.validate_match_result_integrity()
returns trigger
language plpgsql
as $$
declare
  participation_record public.batch_participations%rowtype;
  pair_record public.match_pairs%rowtype;
begin
  select *
  into participation_record
  from public.batch_participations
  where id = new.participation_id;

  if participation_record.id is null then
    raise exception 'Participation does not exist.'
      using errcode = '23503';
  end if;

  if participation_record.batch_id <> new.batch_id or participation_record.user_id <> new.user_id then
    raise exception 'Match result must point to a participation from the same batch and user.'
      using errcode = '22023';
  end if;

  if new.match_pair_id is not null then
    select *
    into pair_record
    from public.match_pairs
    where id = new.match_pair_id;

    if pair_record.id is null or pair_record.batch_id <> new.batch_id then
      raise exception 'Match pair must belong to the same batch as the result.'
        using errcode = '22023';
    end if;

    if new.user_id not in (pair_record.left_user_id, pair_record.right_user_id) then
      raise exception 'Result user must belong to the referenced pair.'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_read_state()
returns trigger
language plpgsql
as $$
begin
  if new.is_read and new.read_at is null then
    new.read_at = now();
  elsif not new.is_read then
    new.read_at = null;
  end if;

  return new;
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
  text_answer text;
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

    if question_record.kind = 'text' then
      if jsonb_typeof(answer_value) <> 'string' then
        raise exception 'Question "%" must be a text answer.', question_record.question_code
          using errcode = '22023';
      end if;

      text_answer := btrim(answer_value #>> '{}');

      if question_record.is_required and text_answer = '' then
        raise exception 'Question "%" requires a non-empty answer.', question_record.question_code
          using errcode = '22023';
      end if;
    elsif question_record.kind = 'single' then
      if jsonb_typeof(answer_value) <> 'string' then
        raise exception 'Question "%" must select one option.', question_record.question_code
          using errcode = '22023';
      end if;

      select array_agg(option_item ->> 'id')
      into option_ids
      from jsonb_array_elements(question_record.options_json) option_item;

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
      from jsonb_array_elements(question_record.options_json) option_item;

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

  select id
  into v_version_id
  from public.questionnaire_versions
  where status = 'published'
  order by version_no desc
  limit 1;

  if v_version_id is null then
    raise exception 'No published questionnaire is available.'
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

  select id
  into v_version_id
  from public.questionnaire_versions
  where status = 'published'
  order by version_no desc
  limit 1;

  if v_version_id is null then
    raise exception 'No published questionnaire is available.'
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
     or coalesce(btrim(v_profile.department), '') = ''
     or coalesce(btrim(v_profile.major), '') = ''
     or coalesce(btrim(v_profile.grade), '') = ''
     or coalesce(btrim(v_profile.gender), '') = ''
     or coalesce(btrim(v_profile.target_preference), '') = '' then
    raise exception 'Please complete your profile before joining the batch.'
      using errcode = '22023';
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
    'department', v_profile.department,
    'major', v_profile.major,
    'grade', v_profile.grade,
    'gender', v_profile.gender,
    'target_preference', v_profile.target_preference,
    'bio', v_profile.bio,
    'interests', to_jsonb(v_profile.interests),
    'show_nickname', v_profile.show_nickname
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

create or replace function public.cancel_current_batch_join()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_batch_id uuid;
  v_participation_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select id
  into v_batch_id
  from public.match_batches
  where status = 'open'
    and signup_start_at <= now()
    and signup_end_at >= now()
  order by signup_end_at
  limit 1;

  if v_batch_id is null then
    raise exception 'No cancellable batch is currently open.'
      using errcode = '22023';
  end if;

  select id
  into v_participation_id
  from public.batch_participations
  where batch_id = v_batch_id
    and user_id = v_user_id
  limit 1;

  if v_participation_id is null then
    raise exception 'No participation record exists for the current batch.'
      using errcode = '22023';
  end if;

  update public.batch_participations
  set status = 'cancelled',
      cancelled_at = now()
  where id = v_participation_id
    and status <> 'locked';

  if not found then
    raise exception 'This batch is already locked.'
      using errcode = '55000';
  end if;

  return v_participation_id;
end;
$$;

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
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  update public.match_results
  set viewed_at = coalesce(viewed_at, now())
  where id = p_match_result_id
    and user_id = v_user_id
  returning id into p_match_result_id;

  if p_match_result_id is null then
    raise exception 'Match result not found.'
      using errcode = '23503';
  end if;

  return p_match_result_id;
end;
$$;

create or replace function public.mark_notification_read(
  p_notification_id uuid
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
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  update public.notifications
  set is_read = true
  where id = p_notification_id
    and user_id = v_user_id
  returning id into p_notification_id;

  if p_notification_id is null then
    raise exception 'Notification not found.'
      using errcode = '23503';
  end if;

  return p_notification_id;
end;
$$;

create or replace function public.create_service_request(
  p_request_type text,
  p_sender_name text default null,
  p_sender_email text default null,
  p_topic text default null,
  p_message text default null,
  p_priority text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_request_id uuid;
  v_sender_email text := p_sender_email;
  v_sender_name text := p_sender_name;
  v_request_type text := lower(p_request_type);
  v_priority text := lower(coalesce(p_priority, 'normal'));
begin
  if v_request_type not in ('consultation', 'report', 'export_data', 'delete_account') then
    raise exception 'Unsupported request type.'
      using errcode = '22023';
  end if;

  if v_priority not in ('normal', 'urgent') then
    raise exception 'Unsupported request priority.'
      using errcode = '22023';
  end if;

  if v_request_type in ('export_data', 'delete_account') and v_user_id is null then
    raise exception 'Authentication required for this request type.'
      using errcode = '42501';
  end if;

  if v_user_id is not null then
    v_sender_email := coalesce(v_sender_email, public.current_user_email());

    select nickname
    into v_sender_name
    from public.app_users
    where id = v_user_id;

    v_sender_name := coalesce(p_sender_name, v_sender_name);
  end if;

  if v_sender_email is null or btrim(v_sender_email) = '' then
    raise exception 'Sender email is required.'
      using errcode = '22023';
  end if;

  insert into public.service_requests (
    request_type,
    user_id,
    sender_name,
    sender_email,
    topic,
    message,
    priority
  )
  values (
    v_request_type,
    v_user_id,
    nullif(btrim(v_sender_name), ''),
    lower(btrim(v_sender_email)),
    nullif(btrim(p_topic), ''),
    nullif(btrim(p_message), ''),
    v_priority
  )
  returning id into v_request_id;

  return v_request_id;
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
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select *
  into v_pair_record
  from public.match_pairs
  where id = p_match_pair_id;

  if v_pair_record.id is null then
    raise exception 'Match pair not found.'
      using errcode = '23503';
  end if;

  if v_user_id not in (v_pair_record.left_user_id, v_pair_record.right_user_id) then
    raise exception 'You do not have access to this match pair.'
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

create trigger touch_app_configs_updated_at
before update on public.app_configs
for each row
execute function public.touch_updated_at();

create trigger touch_app_users_updated_at
before update on public.app_users
for each row
execute function public.touch_updated_at();

create trigger restrict_app_user_self_update
before update on public.app_users
for each row
execute function public.restrict_app_user_self_update();

create trigger touch_questionnaire_versions_updated_at
before update on public.questionnaire_versions
for each row
execute function public.touch_updated_at();

create trigger touch_questionnaire_sections_updated_at
before update on public.questionnaire_sections
for each row
execute function public.touch_updated_at();

create trigger touch_questionnaire_questions_updated_at
before update on public.questionnaire_questions
for each row
execute function public.touch_updated_at();

create trigger touch_questionnaire_submissions_updated_at
before update on public.questionnaire_submissions
for each row
execute function public.touch_updated_at();

create trigger touch_match_batches_updated_at
before update on public.match_batches
for each row
execute function public.touch_updated_at();

create trigger touch_batch_participations_updated_at
before update on public.batch_participations
for each row
execute function public.touch_updated_at();

create trigger touch_match_pairs_updated_at
before update on public.match_pairs
for each row
execute function public.touch_updated_at();

create trigger touch_match_results_updated_at
before update on public.match_results
for each row
execute function public.touch_updated_at();

create trigger touch_announcements_updated_at
before update on public.announcements
for each row
execute function public.touch_updated_at();

create trigger touch_service_requests_updated_at
before update on public.service_requests
for each row
execute function public.touch_updated_at();

create trigger enforce_allowed_auth_email_domain_before_insert
before insert or update of email on auth.users
for each row
execute function public.enforce_allowed_auth_email_domain();

create trigger handle_new_auth_user_after_insert
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create trigger prevent_published_sections_change
before update or delete on public.questionnaire_sections
for each row
execute function public.prevent_published_questionnaire_content_change();

create trigger prevent_published_questions_change
before update or delete on public.questionnaire_questions
for each row
execute function public.prevent_published_questionnaire_content_change();

create trigger prevent_submitted_submission_change
before update or delete on public.questionnaire_submissions
for each row
execute function public.prevent_submitted_submission_mutation();

create trigger validate_match_batch_questionnaire_lock
before insert or update on public.match_batches
for each row
execute function public.validate_match_batch_questionnaire_lock();

create trigger validate_match_pair_integrity
before insert or update on public.match_pairs
for each row
execute function public.validate_match_pair_integrity();

create trigger validate_match_result_integrity
before insert or update on public.match_results
for each row
execute function public.validate_match_result_integrity();

create trigger sync_notifications_read_state
before insert or update on public.notifications
for each row
execute function public.sync_read_state();

alter table public.app_users enable row level security;
alter table public.questionnaire_versions enable row level security;
alter table public.questionnaire_sections enable row level security;
alter table public.questionnaire_questions enable row level security;
alter table public.questionnaire_submissions enable row level security;
alter table public.match_batches enable row level security;
alter table public.batch_participations enable row level security;
alter table public.match_pairs enable row level security;
alter table public.match_results enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.service_requests enable row level security;
alter table public.app_configs enable row level security;
alter table public.operation_logs enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema app_private to service_role;

grant select on public.app_users to authenticated;
grant select on public.questionnaire_versions to authenticated;
grant select on public.questionnaire_sections to authenticated;
grant select on public.questionnaire_questions to authenticated;
grant select on public.questionnaire_submissions to authenticated;
grant select on public.match_batches to authenticated;
grant select on public.batch_participations to authenticated;
grant select on public.match_pairs to authenticated;
grant select on public.match_results to authenticated;
grant select on public.notifications to authenticated;
grant select on public.service_requests to authenticated;
grant select on public.app_configs to anon, authenticated;
grant select on public.announcements to anon, authenticated;
grant select on public.operation_logs to authenticated;

grant insert, update, delete on public.app_users to authenticated;
grant insert, update, delete on public.questionnaire_versions to authenticated;
grant insert, update, delete on public.questionnaire_sections to authenticated;
grant insert, update, delete on public.questionnaire_questions to authenticated;
grant insert, update, delete on public.match_batches to authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant insert, update, delete on public.app_configs to authenticated;
grant insert, update, delete on public.service_requests to authenticated;
grant insert on public.operation_logs to authenticated;

create policy "app_users_select_self_or_admin"
on public.app_users
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "app_users_update_self_or_admin"
on public.app_users
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "questionnaire_versions_read_published_or_admin"
on public.questionnaire_versions
for select
to authenticated
using (status = 'published' or public.is_admin());

create policy "questionnaire_versions_admin_write"
on public.questionnaire_versions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "questionnaire_sections_read_published_or_admin"
on public.questionnaire_sections
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.questionnaire_versions
    where id = questionnaire_version_id
      and status = 'published'
  )
);

create policy "questionnaire_sections_admin_write"
on public.questionnaire_sections
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "questionnaire_questions_read_published_or_admin"
on public.questionnaire_questions
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.questionnaire_versions
    where id = questionnaire_version_id
      and status = 'published'
  )
);

create policy "questionnaire_questions_admin_write"
on public.questionnaire_questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "questionnaire_submissions_read_self_or_admin"
on public.questionnaire_submissions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "questionnaire_submissions_admin_write"
on public.questionnaire_submissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "match_batches_read_authenticated"
on public.match_batches
for select
to authenticated
using (true);

create policy "match_batches_admin_write"
on public.match_batches
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "batch_participations_read_self_or_admin"
on public.batch_participations
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "batch_participations_admin_write"
on public.batch_participations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "match_pairs_read_related_or_admin"
on public.match_pairs
for select
to authenticated
using (
  public.is_admin()
  or auth.uid() in (left_user_id, right_user_id)
);

create policy "match_pairs_admin_write"
on public.match_pairs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "match_results_read_self_or_admin"
on public.match_results
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "match_results_admin_write"
on public.match_results
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "notifications_read_self_or_admin"
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "notifications_admin_write"
on public.notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "announcements_public_read"
on public.announcements
for select
to anon, authenticated
using (
  public.is_admin()
  or (
    status = 'published'
    and starts_at <= now()
    and ends_at >= now()
    and (
      audience in ('public', 'all')
      or (auth.uid() is not null and audience = 'user')
      or (public.is_admin() and audience = 'admin')
    )
  )
);

create policy "announcements_admin_write"
on public.announcements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "service_requests_read_self_or_admin"
on public.service_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "service_requests_admin_write"
on public.service_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "app_configs_read_all"
on public.app_configs
for select
to anon, authenticated
using (true);

create policy "app_configs_admin_write"
on public.app_configs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "operation_logs_admin_read"
on public.operation_logs
for select
to authenticated
using (public.is_admin());

create policy "operation_logs_admin_insert"
on public.operation_logs
for insert
to authenticated
with check (public.is_admin());

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_user_email() to authenticated;
grant execute on function public.get_allowed_email_domains() to anon, authenticated;
grant execute on function public.save_questionnaire_draft(jsonb) to authenticated;
grant execute on function public.submit_questionnaire(jsonb) to authenticated;
grant execute on function public.join_current_batch() to authenticated;
grant execute on function public.cancel_current_batch_join() to authenticated;
grant execute on function public.mark_match_result_viewed(uuid) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.create_service_request(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.trigger_match_contact(uuid) to authenticated;
