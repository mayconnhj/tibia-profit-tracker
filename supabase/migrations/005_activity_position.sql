-- Ordem manual das atividades em "Registrar sessão" (arrastar pra cima/baixo).
-- Só adiciona uma coluna; atividades sem posição (null) ficam no fim, por data de criação.

alter table activities add column if not exists position int;

-- Preenche a ordem atual (por data de criação) pra quem já tem atividades cadastradas.
update activities a
set position = s.rn
from (select id, row_number() over (order by created_at) as rn from activities) s
where a.id = s.id and a.position is null;
