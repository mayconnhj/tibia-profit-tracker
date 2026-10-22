-- O trigger original só marcava locked = true quando a linha era tocada depois
-- do grace period, mas não impedia a edição: um UPDATE num mês travado
-- simplesmente sobrescrevia a taxa. Agora o UPDATE é rejeitado se o mês
-- já estava travado ou se o grace period (7 dias após o fim do mês) já passou.

create or replace function auto_lock_monthly_rate() returns trigger as $$
declare
  end_of_month date;
  past_grace boolean;
begin
  end_of_month := (make_date(new.year, new.month, 1) + interval '1 month')::date;
  past_grace := current_date >= end_of_month + interval '7 days';

  if tg_op = 'UPDATE' and (old.locked or past_grace) then
    raise exception 'Taxa de %/% está travada e não pode ser alterada.', new.month, new.year
      using errcode = 'check_violation';
  end if;

  if past_grace then
    new.locked := true;
    new.locked_at := coalesce(new.locked_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
