-- O site agora fica público na internet e exige login (Supabase Auth).
-- Desfaz o 003: religa RLS e libera as tabelas só pra usuários logados.
-- A anon key (que vai no bundle do site) não lê nem escreve mais nada.
--
-- IMPORTANTE: desligue o cadastro público em Authentication → Sign In / Providers
-- ("Allow new users to sign up" = off) e crie seu usuário em Authentication → Users.
-- Senão qualquer um cria conta e vira "authenticated".

alter table characters    enable row level security;
alter table activities    enable row level security;
alter table sessions      enable row level security;
alter table session_items enable row level security;
alter table expenses      enable row level security;
alter table monthly_rates enable row level security;

drop policy if exists "authenticated full access" on characters;
drop policy if exists "authenticated full access" on activities;
drop policy if exists "authenticated full access" on sessions;
drop policy if exists "authenticated full access" on session_items;
drop policy if exists "authenticated full access" on expenses;
drop policy if exists "authenticated full access" on monthly_rates;

create policy "authenticated full access" on characters    for all to authenticated using (true) with check (true);
create policy "authenticated full access" on activities    for all to authenticated using (true) with check (true);
create policy "authenticated full access" on sessions      for all to authenticated using (true) with check (true);
create policy "authenticated full access" on session_items for all to authenticated using (true) with check (true);
create policy "authenticated full access" on expenses      for all to authenticated using (true) with check (true);
create policy "authenticated full access" on monthly_rates for all to authenticated using (true) with check (true);

-- Views rodam com as permissões do dono por padrão e ignorariam o RLS.
alter view v_session_totals set (security_invoker = true);
