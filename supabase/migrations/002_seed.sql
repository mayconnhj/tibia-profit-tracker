-- Seed opcional: personagem padrão, algumas atividades comuns e taxa do mês atual.
-- Ajuste os valores como quiser antes de rodar.
-- characters/activities não têm unique(name), então "on conflict do nothing" não
-- evitaria duplicatas. Usa "where not exists" para o seed ser idempotente.

insert into characters (name, vocation, world)
select v.name, v.vocation, v.world
from (values ('Main EK', 'Elite Knight', 'Antica')) as v(name, vocation, world)
where not exists (select 1 from characters c where c.name = v.name);

insert into activities (name, type, color)
select v.name, v.type, v.color
from (values
  ('Rotten Blood T1', 'quest', 'purple'),
  ('Rotten Blood T2', 'quest', 'purple'),
  ('Soul War Quest', 'quest', 'teal'),
  ('Mini Boss Main', 'mini_boss', 'coral'),
  ('Hunt Goanna', 'hunt', 'blue'),
  ('Bazaar', 'bazaar', 'amber')
) as v(name, type, color)
where not exists (select 1 from activities a where a.name = v.name);

-- Taxa do mês corrente (edite depois na aba Config)
insert into monthly_rates (year, month, tc_to_gold, tc_to_brl)
values (
  extract(year from current_date)::int,
  extract(month from current_date)::int,
  40000,
  0.85
)
on conflict (year, month) do nothing;
