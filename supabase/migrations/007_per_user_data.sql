-- Site aberto ao público: cada conta enxerga e altera SÓ os próprios dados.
--
-- Até o 006, qualquer usuário logado lia e escrevia tudo (policy "using (true)").
-- Aqui cada tabela ganha um dono (user_id), o RLS passa a filtrar por auth.uid()
-- e os dados que já existem são entregues à conta atual (a única cadastrada).
--
-- Rode inteiro no SQL Editor do Supabase. Roda dentro de uma transação: se algo
-- falhar, nada muda.
--
-- Depois de rodar: ligue "Allow new users to sign up" em
-- Authentication → Sign In / Providers (o 006 pedia pra deixar desligado).

begin;

-- =====================================================
-- 1. Coluna de dono em todas as tabelas
-- default auth.uid(): o app não precisa mandar user_id nos inserts.
-- =====================================================
alter table characters    add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table activities    add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table sessions      add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table session_items add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table expenses      add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table monthly_rates add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- =====================================================
-- 2. Dados atuais → conta atual
-- Só é seguro adivinhar o dono se houver exatamente UMA conta. Com mais de uma,
-- para tudo e pede pra preencher na mão.
-- =====================================================
do $$
declare
  n int;
  owner uuid;
begin
  select count(*) into n from auth.users;
  if n = 0 then
    -- banco vazio de contas: só não pode haver dados órfãos
    if exists (select 1 from characters) or exists (select 1 from activities)
       or exists (select 1 from sessions) or exists (select 1 from expenses)
       or exists (select 1 from monthly_rates) then
      raise exception 'Há dados mas nenhuma conta em auth.users. Crie sua conta antes de rodar este arquivo.';
    end if;
    return;
  end if;
  if n > 1 and (exists (select 1 from characters    where user_id is null)
             or exists (select 1 from activities    where user_id is null)
             or exists (select 1 from sessions      where user_id is null)
             or exists (select 1 from session_items where user_id is null)
             or exists (select 1 from expenses      where user_id is null)
             or exists (select 1 from monthly_rates where user_id is null)) then
    raise exception 'Existem % contas: não dá pra saber de quem são os dados atuais. Preencha user_id manualmente.', n;
  end if;

  select id into owner from auth.users order by created_at limit 1;
  update characters    set user_id = owner where user_id is null;
  update activities    set user_id = owner where user_id is null;
  update sessions      set user_id = owner where user_id is null;
  update session_items set user_id = owner where user_id is null;
  update expenses      set user_id = owner where user_id is null;

  -- O trigger do 004 recusa QUALQUER update em mês travado, inclusive este, que só
  -- preenche o dono e não mexe na taxa. Pausa o trigger só aqui (dentro desta
  -- transação; se algo falhar ele volta ligado no rollback).
  alter table monthly_rates disable trigger monthly_rates_auto_lock;
  update monthly_rates set user_id = owner where user_id is null;
  alter table monthly_rates enable trigger monthly_rates_auto_lock;
end $$;

alter table characters    alter column user_id set not null;
alter table activities    alter column user_id set not null;
alter table sessions      alter column user_id set not null;
alter table session_items alter column user_id set not null;
alter table expenses      alter column user_id set not null;
alter table monthly_rates alter column user_id set not null;

create index if not exists characters_user_idx    on characters (user_id);
create index if not exists activities_user_idx    on activities (user_id);
create index if not exists sessions_user_idx      on sessions (user_id, started_at desc);
create index if not exists session_items_user_idx on session_items (user_id);
create index if not exists expenses_user_idx      on expenses (user_id, occurred_at desc);

-- =====================================================
-- 3. Taxa do mês passa a ser por conta
-- (antes era uma taxa só pro site inteiro: unique (year, month))
-- =====================================================
alter table monthly_rates drop constraint if exists monthly_rates_year_month_key;
alter table monthly_rates drop constraint if exists monthly_rates_user_year_month_key;
alter table monthly_rates add constraint monthly_rates_user_year_month_key unique (user_id, year, month);

-- =====================================================
-- 4. Policies: cada um só no que é seu
-- Nos filhos (sessões, itens, despesas) também confere que o "pai" é da mesma
-- conta, pra ninguém pendurar registro na sessão/personagem de outra pessoa.
-- =====================================================
drop policy if exists "authenticated full access" on characters;
drop policy if exists "authenticated full access" on activities;
drop policy if exists "authenticated full access" on sessions;
drop policy if exists "authenticated full access" on session_items;
drop policy if exists "authenticated full access" on expenses;
drop policy if exists "authenticated full access" on monthly_rates;

drop policy if exists "own rows" on characters;
drop policy if exists "own rows" on activities;
drop policy if exists "own rows" on sessions;
drop policy if exists "own rows" on session_items;
drop policy if exists "own rows" on expenses;
drop policy if exists "own rows" on monthly_rates;

-- (select auth.uid()) em vez de auth.uid(): o Postgres calcula uma vez por consulta,
-- não uma vez por linha.
create policy "own rows" on characters for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own rows" on activities for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own rows" on monthly_rates for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own rows" on sessions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from activities a where a.id = activity_id and a.user_id = (select auth.uid()))
    and exists (select 1 from characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

create policy "own rows" on session_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from sessions s where s.id = session_id and s.user_id = (select auth.uid()))
  );

create policy "own rows" on expenses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

-- a view já usa security_invoker (006), então respeita essas policies
alter view v_session_totals set (security_invoker = true);

-- =====================================================
-- 5. Conta nova já começa com algumas atividades comuns
-- (personagem e taxa do mês cada um cadastra na aba Cadastros)
-- =====================================================
create or replace function public.seed_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activities (user_id, name, type, color, position)
  values
    (new.id, 'Rotten Blood T1', 'quest',  'purple', 1),
    (new.id, 'Rotten Blood T2', 'quest',  'purple', 2),
    (new.id, 'Soul War Quest',  'quest',  'teal',   3),
    (new.id, 'Make Believe',    'quest',  'coral',  4),
    (new.id, 'Hunt',            'hunt',   'blue',   5),
    (new.id, 'Bazaar',          'bazaar', 'amber',  6);
  return new;
end;
$$;

revoke execute on function public.seed_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_seed on auth.users;
create trigger on_auth_user_created_seed
  after insert on auth.users
  for each row execute function public.seed_new_user();

commit;
