-- O projeto não usa Auth: o app acessa o banco só com a anon key.
-- O Supabase cria tabelas com RLS habilitado e sem policies, o que faz
-- todo SELECT voltar [] em silêncio e todo INSERT/UPDATE falhar com 42501.
-- Desabilita RLS nas 6 tabelas.
-- ATENÇÃO: com isso, qualquer pessoa com a URL + anon key lê e escreve tudo.

alter table characters    disable row level security;
alter table activities    disable row level security;
alter table sessions      disable row level security;
alter table session_items disable row level security;
alter table expenses      disable row level security;
alter table monthly_rates disable row level security;
