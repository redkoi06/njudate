create index if not exists match_batches_status_signup_end_idx
  on public.match_batches (status, signup_end_at desc);

create index if not exists match_batches_status_publish_idx
  on public.match_batches (status, result_publish_at desc);

create index if not exists questionnaire_submissions_user_version_idx
  on public.questionnaire_submissions (user_id, questionnaire_version_id, submission_no desc);

create index if not exists questionnaire_submissions_version_status_idx
  on public.questionnaire_submissions (questionnaire_version_id, status, user_id);

create index if not exists batch_participations_batch_user_idx
  on public.batch_participations (batch_id, user_id);

create index if not exists batch_participations_user_updated_idx
  on public.batch_participations (user_id, updated_at desc);

create index if not exists match_results_pair_user_idx
  on public.match_results (match_pair_id, user_id, released_at);

create index if not exists questionnaire_sections_version_order_idx
  on public.questionnaire_sections (questionnaire_version_id, sort_order);

create index if not exists questionnaire_questions_version_order_idx
  on public.questionnaire_questions (questionnaire_version_id, sort_order);

create index if not exists app_users_created_at_idx
  on public.app_users (created_at desc);
