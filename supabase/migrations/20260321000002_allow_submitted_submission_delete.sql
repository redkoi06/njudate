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
