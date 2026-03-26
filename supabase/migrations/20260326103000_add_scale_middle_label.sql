alter table public.questionnaire_questions
  add column if not exists scale_middle_label text null;

alter table public.questionnaire_questions
  drop constraint if exists questionnaire_questions_kind_shape_check;

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
      and scale_middle_label is null
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
