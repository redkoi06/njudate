begin;

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
    if tg_table_name = 'questionnaire_questions'
       and tg_op = 'UPDATE'
       and (to_jsonb(new) - 'weight' - 'updated_at') = (to_jsonb(old) - 'weight' - 'updated_at') then
      return new;
    end if;

    raise exception 'Published questionnaire content cannot be changed.'
      using errcode = '55000';
  end if;

  return coalesce(new, old);
end;
$$;

commit;
