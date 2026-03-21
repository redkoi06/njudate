insert into public.app_configs (config_key, value_json, description)
values
  ('registration_open', 'true'::jsonb, 'Whether new users can register with email confirmation.'),
  ('weekly_participation_open', 'true'::jsonb, 'Whether users can join the current batch.'),
  ('allowed_email_domains', '["smail.nju.edu.cn", "qq.com"]'::jsonb, 'Approved email domains.'),
  ('auth_mode', '"otp"'::jsonb, 'Authentication mode used by the app.'),
  ('match_schedule_text', '"每周二 20:30 统一公布结果。"'::jsonb, 'Public-facing match schedule description.'),
  ('contact_flow_text', '"点击联系后，平台会向双方开放昵称与校内邮箱，并同步发送提醒。"'::jsonb, 'Public-facing contact flow description.'),
  ('feature_flags', '{"admin_console_enabled": false, "public_match_history": false}'::jsonb, 'Feature flags used by the app shell.'),
  ('repeat_match_cooldown_days', '28'::jsonb, 'Minimum cooldown before repeating the same match.')
on conflict (config_key) do update
set value_json = excluded.value_json,
    description = excluded.description,
    updated_at = now();

insert into public.questionnaire_versions (
  id,
  version_no,
  status,
  title,
  description,
  published_at
)
values (
  'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
  1,
  'published',
  '2026 春季问卷',
  '用于首发版本的正式匹配问卷。',
  now()
)
on conflict (id) do nothing;

insert into public.questionnaire_sections (
  id,
  questionnaire_version_id,
  code,
  title,
  subtitle,
  description,
  sort_order
)
values
  (
    'c55ad0a5-b2fd-4ec2-9c1d-d5fb3ecf4d11',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'daily',
    '日常节奏',
    '你的生活是怎样展开的',
    '这一部分关注你的作息、安排方式和舒服的日常状态。',
    1
  ),
  (
    '1ce5601c-5be5-4b75-a28c-7be53b561881',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'communication',
    '沟通方式',
    '你如何接近别人，也如何被接近',
    '这一部分关注你的表达习惯、回应节奏和边界感。',
    2
  ),
  (
    'db0bd72f-ded4-49bf-8911-6bdfcf0e74f9',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'values',
    '价值取向',
    '你在意什么，如何理解关系',
    '这一部分帮助平台理解你真正看重的东西。',
    3
  ),
  (
    '883ff3db-7066-4b4e-9411-40fd2d73075f',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'future',
    '关系期待',
    '你准备怎样开始认识一个人',
    '这一部分帮助平台理解你现在的阶段与关系期待。',
    4
  )
on conflict (id) do nothing;

with window_data as (
  select
    now() - interval '1 day' as signup_start_at,
    now() + interval '2 days' as signup_end_at,
    now() + interval '3 days' as match_run_at,
    now() + interval '3 days' as result_publish_at
)
insert into public.match_batches (
  id,
  code,
  label,
  questionnaire_version_id,
  signup_start_at,
  signup_end_at,
  match_run_at,
  result_publish_at,
  status,
  notes
)
select
  'b6b2fcfe-e95a-44d7-82a3-df68ea0dd5cf',
  to_char(timezone('Asia/Shanghai', now()), '"batch-"IYYYIW'),
  '当前匹配批次',
  'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
  signup_start_at,
  signup_end_at,
  match_run_at,
  result_publish_at,
  'open',
  '系统初始化时创建的当前开放批次。'
from window_data
on conflict (id) do nothing;

insert into public.announcements (
  id,
  title,
  body,
  eyebrow,
  audience,
  status,
  starts_at,
  ends_at,
  published_at
)
values (
  '3cad4631-45c0-4097-8735-c85d6f60fd31',
  '欢迎来到 NJU Date',
  '当前版本已开放正式注册、问卷填写和按周参与。请先完善资料并提交问卷，再决定是否加入本周匹配。',
  '首发说明',
  'all',
  'published',
  now() - interval '1 day',
  now() + interval '30 days',
  now()
)
on conflict (id) do nothing;

insert into public.questionnaire_questions (
  id,
  questionnaire_version_id,
  section_id,
  question_code,
  kind,
  prompt,
  helper_text,
  placeholder,
  is_required,
  options_json,
  scale_min,
  scale_max,
  scale_left_label,
  scale_right_label,
  sort_order
)
values
  (
    '291167ee-bef8-4ae6-b3e5-bcc2575d39a7',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'c55ad0a5-b2fd-4ec2-9c1d-d5fb3ecf4d11',
    'daily_evening',
    'text',
    '描述一个你愿意重复很多次的普通晚上。',
    null,
    '不需要很特别，只要是你真实会选择的样子。',
    true,
    null,
    null,
    null,
    null,
    null,
    1
  ),
  (
    '54f61b44-a1de-4e46-b3cf-ef2e776bfdfa',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'c55ad0a5-b2fd-4ec2-9c1d-d5fb3ecf4d11',
    'schedule_style',
    'single',
    '面对时间安排时，你更接近哪一种？',
    null,
    null,
    true,
    '[{"id":"planned","label":"先排清楚计划，按顺序推进会让我安心"},{"id":"flexible","label":"给自己留出弹性，过度安排会让我疲惫"},{"id":"mixed","label":"学习工作有计划，私人时间更随性"},{"id":"mood","label":"完全看状态，不想预设固定模式"}]'::jsonb,
    null,
    null,
    null,
    null,
    2
  ),
  (
    '2e1c5002-b4f2-4a20-88d4-982efdf3c198',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'c55ad0a5-b2fd-4ec2-9c1d-d5fb3ecf4d11',
    'relax_scenes',
    'multiple',
    '哪些场景最容易让你放松下来？',
    null,
    null,
    true,
    '[{"id":"walk","label":"安静散步"},{"id":"meal","label":"一起吃饭"},{"id":"talk","label":"长时间对谈"},{"id":"doing","label":"一起做事"},{"id":"quiet_company","label":"各自待着但知道对方在"}]'::jsonb,
    null,
    null,
    null,
    null,
    3
  ),
  (
    'cb0a1d4f-a3f9-43db-bf57-d4b4cbb0d0b9',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    '1ce5601c-5be5-4b75-a28c-7be53b561881',
    'stress_support',
    'text',
    '当你遇到情绪或压力时，最希望别人怎样靠近你？',
    null,
    '可以写你希望被询问、被陪伴，或想先自己消化。',
    true,
    null,
    null,
    null,
    null,
    null,
    1
  ),
  (
    '89ec05e0-0344-4cc2-b436-215ef53d06cf',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    '1ce5601c-5be5-4b75-a28c-7be53b561881',
    'communication_frequency',
    'scale',
    '在关系里，保持稳定沟通频率对你有多重要？',
    null,
    null,
    true,
    null,
    1,
    5,
    '不太重要',
    '非常重要',
    2
  ),
  (
    '0ca3f16a-fca4-4e89-a78a-ac51aa3e73ef',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    '1ce5601c-5be5-4b75-a28c-7be53b561881',
    'disagreement_style',
    'single',
    '如果意见不一致，你通常会怎么处理？',
    null,
    null,
    true,
    '[{"id":"direct","label":"先把自己的想法说清楚，再一起讨论"},{"id":"pause","label":"先缓一缓，等情绪稳定后再谈"},{"id":"listen","label":"更愿意听对方说完，再决定怎么回应"},{"id":"contextual","label":"看人和场景，没有固定做法"}]'::jsonb,
    null,
    null,
    null,
    null,
    3
  ),
  (
    '2d8fe415-ce2a-4d60-9e5d-d79e4bb5ba65',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'db0bd72f-ded4-49bf-8911-6bdfcf0e74f9',
    'relationship_shift',
    'text',
    '最近一年里，有什么观念或经历明显改变了你看待关系的方式？',
    null,
    '可以是一段经历，也可以是一句话让你停下来思考。',
    true,
    null,
    null,
    null,
    null,
    null,
    1
  ),
  (
    '5725e689-1e28-470c-99a1-0fd13f7e7ef9',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'db0bd72f-ded4-49bf-8911-6bdfcf0e74f9',
    'primary_expectation',
    'single',
    '你更希望一段关系首先给你带来什么感受？',
    null,
    null,
    true,
    '[{"id":"understood","label":"被理解"},{"id":"accompanied","label":"被陪伴"},{"id":"inspired","label":"被激发"},{"id":"relaxed","label":"足够轻松"},{"id":"stable","label":"稳定踏实"}]'::jsonb,
    null,
    null,
    null,
    null,
    2
  ),
  (
    'af6a8247-a242-476e-8638-c6efa0b86e3b',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    'db0bd72f-ded4-49bf-8911-6bdfcf0e74f9',
    'boundaries',
    'text',
    '有没有什么边界，是你希望认识之前就被尊重的？',
    null,
    '比如沟通节奏、见面频率、表达方式等。',
    true,
    null,
    null,
    null,
    null,
    null,
    3
  ),
  (
    'e8c6f9c5-4db1-466f-85e5-f0218d7865fd',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    '883ff3db-7066-4b4e-9411-40fd2d73075f',
    'current_stage',
    'single',
    '如果必须选一句来描述你现在的状态，会更接近哪一项？',
    null,
    null,
    true,
    '[{"id":"slow_start","label":"想认真认识人，但不急于下结论"},{"id":"build_trust","label":"更想慢慢建立信任，再决定关系方向"},{"id":"quality_exchange","label":"希望先有高质量交流，再看能走多远"},{"id":"steady_light","label":"当前以稳定、轻松、不消耗为优先"}]'::jsonb,
    null,
    null,
    null,
    null,
    1
  ),
  (
    'fe28f12f-a81c-4bf0-86e1-9f0604e0d16a',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    '883ff3db-7066-4b4e-9411-40fd2d73075f',
    'encounter_vibe',
    'text',
    '如果平台只帮你带来一次相遇，你希望这次相遇具备什么气质？',
    null,
    '可以写真诚、平静、有趣、克制、踏实，或者你自己的表达。',
    true,
    null,
    null,
    null,
    null,
    null,
    2
  ),
  (
    'afbdab6b-734f-4140-a598-1ad765903f26',
    'd8d6528f-b6fc-46d3-9a8c-6bb9730d9c5d',
    '883ff3db-7066-4b4e-9411-40fd2d73075f',
    'before_meeting',
    'text',
    '还有什么你想在认识之前先告诉对方？',
    null,
    '这是选填项，可以是一句坦白，也可以留空。',
    false,
    null,
    null,
    null,
    null,
    null,
    3
  )
on conflict (id) do nothing;
