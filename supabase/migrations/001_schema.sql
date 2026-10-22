-- Tibia Profit Tracker - Schema principal
-- Rode este arquivo no SQL Editor do Supabase, ou via supabase db push.

-- =====================================================
-- 1. Personagens
-- =====================================================
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vocation text,
  world text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 2. Catálogo de atividades (RB T1, Soul War, etc)
-- =====================================================
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('hunt', 'quest', 'boss', 'mini_boss', 'bazaar', 'other')),
  color text not null default 'gray',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 3. Sessões (cada rotinha registrada)
-- =====================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete restrict,
  character_id uuid not null references characters(id) on delete restrict,
  started_at timestamptz not null default now(),
  duration_min int not null check (duration_min >= 0),
  profit_gold bigint not null default 0,   -- profit da quest, sempre em gold
  service_tc int not null default 0,       -- boneco pagante, sempre em TC
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists sessions_started_at_idx on sessions (started_at desc);
create index if not exists sessions_activity_idx on sessions (activity_id);

-- =====================================================
-- 4. Itens dropados
-- Um item começa "pendente" (sold_at null) e vira "vendido"
-- quando você registra o preço na aba Inventário.
-- =====================================================
create table if not exists session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  item_name text not null,
  quantity int not null default 1 check (quantity > 0),
  sold_price bigint,                                       -- null enquanto pendente
  sold_currency text check (sold_currency in ('gold', 'tc')),
  sold_at timestamptz,                                     -- null enquanto pendente
  created_at timestamptz not null default now()
);

create index if not exists session_items_pending_idx
  on session_items (session_id) where sold_at is null;

-- =====================================================
-- 5. Despesas (boost, prey, compras, outros)
-- =====================================================
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete restrict,
  occurred_at date not null default current_date,
  category text not null check (category in ('boost', 'prey', 'purchase', 'other')),
  description text,
  amount bigint not null check (amount > 0),
  currency text not null check (currency in ('gold', 'tc')),
  created_at timestamptz not null default now()
);

create index if not exists expenses_occurred_at_idx on expenses (occurred_at desc);

-- =====================================================
-- 6. Taxas mensais de conversão TC -> Gold e TC -> BRL
-- Cada mês tem seu par próprio. Um mês fica "locked"
-- 7 dias após seu fim (grace period).
-- =====================================================
create table if not exists monthly_rates (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  tc_to_gold bigint not null,          -- ex: 40000
  tc_to_brl numeric(10,4) not null,    -- ex: 0.85
  locked boolean not null default false,
  locked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (year, month)
);

-- Trava o mês automaticamente 7 dias após o fim dele.
create or replace function auto_lock_monthly_rate() returns trigger as $$
declare
  end_of_month date;
begin
  end_of_month := (make_date(new.year, new.month, 1) + interval '1 month')::date;
  if current_date >= end_of_month + interval '7 days' then
    new.locked := true;
    new.locked_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists monthly_rates_auto_lock on monthly_rates;
create trigger monthly_rates_auto_lock
  before insert or update on monthly_rates
  for each row execute function auto_lock_monthly_rate();

-- =====================================================
-- View: total consolidado de uma sessão em GOLD
-- (soma profit + service*tc_to_gold_do_mes + itens vendidos)
-- =====================================================
create or replace view v_session_totals as
select
  s.id as session_id,
  s.activity_id,
  s.character_id,
  s.started_at,
  s.duration_min,
  s.profit_gold,
  s.service_tc,
  coalesce(sum(case when si.sold_currency = 'gold'
                    then si.quantity * si.sold_price end), 0) as items_gold_sold,
  coalesce(sum(case when si.sold_currency = 'tc'
                    then si.quantity * si.sold_price end), 0) as items_tc_sold,
  count(si.id) filter (where si.sold_at is null) as items_pending
from sessions s
left join session_items si on si.session_id = s.id
group by s.id;
