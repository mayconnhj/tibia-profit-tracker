# Tibia Profit Tracker

Site pra registrar sessões de Tibia, itens dropados, service em TC e despesas (boost, prey, compras), com dashboard mensal em gold e em reais. Sem auth agora — uso pessoal, multi-user já contemplado no schema pra abrir depois.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- Supabase (Postgres, sem Auth)
- TanStack Query (data fetching)
- Recharts (gráficos)
- react-hotkeys-hook (atalhos)
- xlsx + papaparse (exports)

## Setup

### 1. Criar projeto no Supabase

1. Vai em https://supabase.com/dashboard, cria um novo projeto (nome sugerido: `tibia-profit-tracker`).
2. Espera 1-2min a provisão terminar.
3. Em **Settings → API**, copia:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public key**

### 2. Rodar as migrations

Abre o **SQL Editor** no painel do Supabase e cola, em ordem:

1. `supabase/migrations/001_schema.sql` — cria as 6 tabelas + view + trigger de auto-lock
2. `supabase/migrations/002_seed.sql` — adiciona um personagem, 6 atividades comuns e a taxa do mês atual (edite os valores antes se quiser)

Aperta **Run** em cada um.

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edita `.env.local` colando as credenciais copiadas no passo 1.

### 4. Instalar e rodar

```bash
npm install
npm run dev
```

Abre http://localhost:5173.

## Como usar

### Home — registro rápido

- Clica em qualquer atividade da grid (ou aperta **1–9**) pra abrir o modal de sessão.
- Preenche: tempo em minutos, profit em gold, service em TC (opcional), itens.
- **Item sem preço fica pendente** — vai pro Inventário e não conta como receita ainda.
- **Ctrl+Enter** salva o modal.

Atalhos globais:
- **E** — nova despesa (boost, prey, compra, outro)
- **I** — ir pro Inventário
- **D** — ir pro Dashboard

### Inventário

- **Aba Pendentes** — itens dropados que ainda não viraram dinheiro. Coluna "Dias parado" fica amarela/vermelha à medida que o tempo passa.
- Clica no **$** verde pra registrar a venda: preço, moeda (gold ou TC), data.
- Ao vender, o item entra no mês da **venda**, com a taxa TC do mês da venda.
- **Aba Vendidos** — histórico.

### Dashboard

- Filtra mês corrente automaticamente.
- KPIs: receita, gastos, líquido (com conversão em BRL), gold/hora médio.
- Ranking de gold/hora por atividade — resposta direta a "o que vale a pena".
- Profit acumulado no mês.
- Tabela detalhada.
- Exports: **CSV**, **XLSX** (multi-aba), **JSON** (backup).

### Config

- **Taxa do mês** — 1 TC vale quanto em gold e em BRL neste mês. Editável até o dia 7 do mês seguinte, depois trava automaticamente (grace period de 7 dias configurado no trigger SQL).
- **Personagens** — cadastrar/listar.
- **Atividades** — cadastrar/arquivar. A cor define a paleta na grid da Home.

## Regras de negócio importantes

1. **Sem rateio** — todo valor registrado já é o que sobrou pra você. Não tem cálculo de "tua fatia".
2. **Duas moedas nativas** — gold e TC coexistem em todo lugar; conversão pra BRL usa a taxa do mês.
3. **Item pendente não distorce estatística** — só conta quando vira dinheiro real.
4. **Histórico congelado** — meses passados usam a taxa TC do próprio mês, então mudar a taxa atual não altera setembro.
5. **Grace period de 7 dias** — depois de virar o mês, você ainda tem 7 dias pra registrar a taxa antes dela travar.

## Deploy

Recomendado: **Vercel**.

```bash
npm run build
```

Ou conecta o repositório no dashboard da Vercel e ela detecta o Vite sozinha. Coloca as duas variáveis `VITE_SUPABASE_*` em Settings → Environment Variables.

## Roadmap (quando for abrir pra outros)

- Adicionar Supabase Auth
- Adicionar RLS policies (`user_id uuid references auth.users` em cada tabela)
- Filtro por personagem no dashboard (schema já suporta)
- Sincronizar preços do Bazaar
- Cache de preços de itens vendidos pra autocomplete inteligente

## Estrutura

```
tibia-profit-tracker/
├── src/
│   ├── components/
│   │   ├── ui/                  Button, Input, Modal, Badge, StatCard
│   │   ├── ActivityGrid.tsx
│   │   ├── SessionModal.tsx
│   │   ├── ExpenseModal.tsx
│   │   ├── SellItemModal.tsx
│   │   ├── RateBanner.tsx
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Inventory.tsx
│   │   ├── Dashboard.tsx
│   │   └── Config.tsx
│   ├── hooks/                    useSessions, useActivities, useExpenses, etc
│   ├── lib/                      supabase, goldFormat, currency, cn, export
│   ├── types/database.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql
│       └── 002_seed.sql
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── .env.example
```
