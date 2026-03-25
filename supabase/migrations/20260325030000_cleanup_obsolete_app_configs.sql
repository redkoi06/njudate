begin;

delete from public.app_configs
where config_key in (
  'weekly_participation_open',
  'repeat_match_cooldown_days',
  'feature_flags'
);

commit;
