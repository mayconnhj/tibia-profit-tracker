import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActivityGrid, ColorMark } from '@/components/ActivityGrid';
import { SessionModal } from '@/components/SessionModal';
import { ExpenseModal } from '@/components/ExpenseModal';
import { RateBanner } from '@/components/RateBanner';
import { StatCard, StatStrip } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useActivities, useAllActivities, useReorderActivities } from '@/hooks/useActivities';
import { ItemIcon } from '@/components/ItemIcon';
import { useSessions, useSessionItems, useDeleteSession } from '@/hooks/useSessions';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useMonthlyRates } from '@/hooks/useMonthlyRates';
import { useHotkeys } from '@/hooks/useHotkeys';
import {
  rateForDate,
  sessionBaseGold,
  soldItemGold,
  isSold,
  expenseAsGold,
  goldToBrl,
  localDateKey,
  toLocalDate,
  formatBRL,
} from '@/lib/currency';
import { formatGoldCompact } from '@/lib/goldFormat';
import { cn, capFirst } from '@/lib/cn';
import type { Activity, Expense, Session, SessionItem } from '@/types/database';

const EXPENSE_LABEL: Record<string, string> = {
  boost: 'Boost',
  prey: 'Prey',
  purchase: 'Compra',
  other: 'Outro',
};

function shiftDay(day: string, delta: number): string {
  const d = toLocalDate(day);
  d.setDate(d.getDate() + delta);
  return localDateKey(d);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Linha que veio destacada de um link (ex: clicar num item no Estoque). */
const FOCUS_ROW = '!bg-highlight shadow-[inset_3px_0_0_hsl(var(--accent))]';

/** Miniatura do item dropado na linha da sessão; pendente ganha um ponto âmbar. */
function DropThumb({
  name,
  qty,
  pending,
  focused,
}: {
  name: string;
  qty: number;
  pending: boolean;
  focused?: boolean;
}) {
  return (
    <span
      className={cn(
        'relative inline-flex rounded-sm border bg-card p-px',
        focused ? 'border-accent ring-2 ring-accent/40' : 'border-border',
      )}
      title={`${name}${qty > 1 ? ` × ${qty}` : ''}${pending ? ' (pendente)' : ' (vendido)'}`}
    >
      <ItemIcon name={name} size={24} />
      {qty > 1 && (
        <span className="absolute -bottom-1 -right-1 rounded-sm bg-header px-0.5 font-mono text-[9px] leading-tight text-white">
          {qty}
        </span>
      )}
      {pending && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-warning ring-1 ring-card" />
      )}
    </span>
  );
}

/** Linha do livro-caixa do dia: sessão (entrada), venda de item (entrada) ou despesa (saída). */
type LedgerRow =
  | { kind: 'session'; sort: string; session: Session; items: SessionItem[]; gold: number }
  | { kind: 'sale'; sort: string; item: SessionItem; gold: number }
  | { kind: 'expense'; sort: string; expense: Expense; gold: number };

export function HomePage() {
  const navigate = useNavigate();
  const activitiesQ = useActivities();
  const allActivitiesQ = useAllActivities();
  const sessionsQ = useSessions();
  const itemsQ = useSessionItems();
  const expensesQ = useExpenses();
  const ratesQ = useMonthlyRates();
  const activities = activitiesQ.data ?? [];
  const allActivities = allActivitiesQ.data ?? [];
  const allSessions = sessionsQ.data ?? [];
  const allItems = itemsQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const rates = ratesQ.data ?? [];
  const loadError = [activitiesQ, sessionsQ, itemsQ, expensesQ, ratesQ].find((q) => q.error)?.error;
  const deleteSession = useDeleteSession();
  const deleteExpense = useDeleteExpense();
  const reorder = useReorderActivities();

  const todayStr = localDateKey();
  // Dia aberto e destaque vêm da URL (?dia=2026-10-02&foco=<id da sessão ou do item>):
  // o Estoque linka direto pro lançamento de um item.
  const [params, setParams] = useSearchParams();
  const validDay = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const day = validDay(params.get('dia')) ?? todayStr;
  const focusId = params.get('foco');
  const isToday = day === todayStr;
  // trocar de dia limpa o destaque; hoje = URL limpa
  const setDay = (next: string) =>
    setParams(next === localDateKey() ? {} : { dia: next }, { replace: true });

  const [selected, setSelected] = React.useState<Activity | null>(null);
  const [editingSession, setEditingSession] = React.useState<{
    session: Session;
    items: SessionItem[];
  } | null>(null);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const anyModal = selected != null || editingSession != null || expenseOpen || editingExpense != null;

  // ---- lançamentos do dia selecionado (data LOCAL) ----
  const dayRate = rateForDate(rates, day);
  const daySessions = allSessions.filter((s) => localDateKey(s.started_at) === day);
  const dayExpenses = expenses.filter((e) => e.occurred_at === day);
  // Item entra no dia/mês da VENDA, não no da sessão
  const daySales = allItems.filter((i) => isSold(i) && localDateKey(i.sold_at!) === day);

  const ledger: LedgerRow[] = [
    ...daySessions.map((s) => ({
      kind: 'session' as const,
      sort: s.started_at,
      session: s,
      items: allItems.filter((i) => i.session_id === s.id),
      gold: sessionBaseGold(s, rateForDate(rates, s.started_at)),
    })),
    ...daySales.map((i) => ({
      kind: 'sale' as const,
      sort: i.sold_at!,
      item: i,
      gold: soldItemGold(i, rates),
    })),
    ...dayExpenses.map((e) => ({
      kind: 'expense' as const,
      sort: '~' + e.created_at, // despesa só tem data: vai pro fim, na ordem de cadastro
      expense: e,
      gold: expenseAsGold(e, rateForDate(rates, e.occurred_at)),
    })),
  ].sort((a, b) => a.sort.localeCompare(b.sort));

  const dayIncome = ledger.filter((r) => r.kind !== 'expense').reduce((s, r) => s + r.gold, 0);
  const dayExpenseGold = ledger.filter((r) => r.kind === 'expense').reduce((s, r) => s + r.gold, 0);
  // despesas em TC sem taxa do mês não têm como virar gold: mostra à parte
  const dayExpenseTcNoRate = dayExpenses
    .filter((e) => e.currency === 'tc' && !rateForDate(rates, e.occurred_at))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const dayNet = dayIncome - dayExpenseGold;
  const dayNetBrl = goldToBrl(dayNet, dayRate);
  const dayMinutes = daySessions.reduce((s, x) => s + x.duration_min, 0);

  const dayLabel = capFirst(new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(toLocalDate(day)));

  const activityOf = (id: string) => allActivities.find((a) => a.id === id);
  const sessionOf = (id: string) => allSessions.find((s) => s.id === id);

  function onDeleteSession(s: Session, items: SessionItem[]) {
    const name = activityOf(s.activity_id)?.name ?? 'sessão';
    const extra = items.length > 0 ? ` e ${items.length} item(ns) dropado(s) nela` : '';
    if (confirm(`Apagar a sessão "${name}" das ${formatTime(s.started_at)}${extra}? Não dá pra desfazer.`))
      deleteSession.mutate(s.id);
  }

  function onDeleteExpense(e: Expense) {
    if (confirm(`Apagar a despesa "${e.description || EXPENSE_LABEL[e.category]}"? Não dá pra desfazer.`))
      deleteExpense.mutate(e.id);
  }

  // ---- atalhos ----
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    (e, hotkey) => {
      // v4/v5: hotkey.keys = ['1']; fallback pelo event.code (Digit1/Numpad1) caso a API mude
      const key = hotkey.keys?.[0] ?? e.code.replace(/^(Digit|Numpad)/, '');
      const idx = Number(key) - 1;
      const a = Number.isInteger(idx) ? activities[idx] : undefined;
      if (a) setSelected(a);
    },
    // preventDefault: senão o "1" digitado cai no input com autoFocus do modal que acabou de abrir
    { enabled: !anyModal, preventDefault: true },
    [activities],
  );
  const hotkeyOpts = { enabled: !anyModal, preventDefault: true };
  useHotkeys('e', () => setExpenseOpen(true), hotkeyOpts);
  useHotkeys('d', () => navigate('/dashboard'), hotkeyOpts, [navigate]);
  useHotkeys('i', () => navigate('/inventario'), hotkeyOpts, [navigate]);
  // deps: o callback precisa do dia atual (o hook memoiza o callback)
  useHotkeys('left', () => setDay(shiftDay(day, -1)), hotkeyOpts, [day, setParams]);
  useHotkeys('right', () => setDay(shiftDay(day, 1)), hotkeyOpts, [day, setParams]);
  useHotkeys('h', () => setDay(localDateKey()), hotkeyOpts, [setParams]);

  // chegou com ?foco=…: rola até a linha destacada quando os dados carregarem
  const focusedRowRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (focusId) focusedRowRef.current?.scrollIntoView({ block: 'center' });
  }, [focusId, day, allSessions.length, allItems.length]);

  const ledgerCols = 'grid-cols-[48px_76px_minmax(0,1fr)_52px_92px_92px_96px]';

  return (
    <div>
      <RateBanner />

      {loadError && (
        <div className="mb-4 border border-[#e0a39d] bg-[#fdf3f2] px-3 py-2 text-xs neg rounded-sm">
          Erro ao carregar dados do Supabase: {(loadError as Error).message}
        </div>
      )}

      <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        {/* Coluna esquerda: registrar */}
        <aside className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="section-label">Registrar sessão</span>
              {activities.length > 1 && (
                <span className="text-[10px] text-muted-foreground">arraste pra ordenar</span>
              )}
            </div>
            {activities.length === 0 ? (
              <div className="sheet sheet-empty">
                Nenhuma atividade cadastrada. Vá em <b>Cadastros</b> pra criar.
              </div>
            ) : (
              <ActivityGrid
                activities={activities}
                onSelect={(a) => setSelected(a)}
                onReorder={(ids) => reorder.mutate(ids)}
              />
            )}
            {reorder.error && (
              <div className="mt-1.5 text-[11px] neg">{(reorder.error as Error).message}</div>
            )}
          </div>

          <Button className="w-full" onClick={() => setExpenseOpen(true)}>
            + Lançar despesa
          </Button>

          <div className="sheet text-xs text-muted-foreground">
            <div className="sheet-head grid-cols-1">Atalhos</div>
            <div className="px-3 py-2 space-y-1">
              <div className="flex justify-between"><span>Registrar atividade</span><span className="kbd">1–9</span></div>
              <div className="flex justify-between"><span>Nova despesa</span><span className="kbd">E</span></div>
              <div className="flex justify-between"><span>Dia anterior / seguinte</span><span><span className="kbd">←</span> <span className="kbd">→</span></span></div>
              <div className="flex justify-between"><span>Voltar para hoje</span><span className="kbd">H</span></div>
              <div className="flex justify-between"><span>Estoque</span><span className="kbd">I</span></div>
              <div className="flex justify-between"><span>Relatório mensal</span><span className="kbd">D</span></div>
            </div>
          </div>
        </aside>

        {/* Coluna direita: livro-caixa do dia */}
        <section className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="section-label">Lançamentos do dia</div>
              <div className="page-title">{dayLabel}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={() => setDay(shiftDay(day, -1))} aria-label="Dia anterior">
                ‹
              </Button>
              <Input
                type="date"
                value={day}
                onChange={(e) => e.target.value && setDay(e.target.value)}
                className="h-7 w-[140px] text-xs font-mono"
              />
              <Button size="sm" onClick={() => setDay(shiftDay(day, 1))} aria-label="Dia seguinte">
                ›
              </Button>
              <Button size="sm" onClick={() => setDay(todayStr)} disabled={isToday}>
                Hoje
              </Button>
            </div>
          </div>

          <div className="sheet">
            <div className={cn('sheet-head', ledgerCols)}>
              <div>Hora</div>
              <div>Tipo</div>
              <div>Descrição</div>
              <div className="text-right">Tempo</div>
              <div className="text-right">Entrada</div>
              <div className="text-right">Saída</div>
              <div />
            </div>

            {ledger.length === 0 ? (
              <div className="sheet-empty">
                Nenhum lançamento {isToday ? 'hoje ainda' : 'neste dia'}.
              </div>
            ) : (
              ledger.map((r) => {
                if (r.kind === 'session') {
                  const s = r.session;
                  const activity = activityOf(s.activity_id);
                  const pending = r.items.filter((i) => i.sold_at == null).length;
                  const focused =
                    focusId != null && (focusId === s.id || r.items.some((i) => i.id === focusId));
                  const details = [
                    r.items.length > 0 && `${r.items.length} item(ns)`,
                    pending > 0 && `${pending} pendente(s)`,
                    s.service_tc > 0 && `${s.service_tc} TC service`,
                    s.notes,
                  ].filter(Boolean);
                  return (
                    <div
                      key={`s-${s.id}`}
                      ref={focused ? focusedRowRef : undefined}
                      className={cn('sheet-row', ledgerCols, focused && FOCUS_ROW)}
                    >
                      <div className="num text-left text-muted-foreground">{formatTime(s.started_at)}</div>
                      <div className="text-xs text-muted-foreground">Sessão</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium">
                          <ColorMark color={activity?.color ?? 'gray'} />
                          <span className="truncate">{activity?.name ?? '(atividade apagada)'}</span>
                        </div>
                        {details.length > 0 && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {details.join(' · ')}
                          </div>
                        )}
                        {r.items.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.items.map((i) => (
                              <DropThumb
                                key={i.id}
                                name={i.item_name}
                                qty={i.quantity}
                                pending={i.sold_at == null}
                                focused={i.id === focusId}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="num text-muted-foreground">{s.duration_min}m</div>
                      <div className={cn('num', r.gold >= 0 ? 'pos' : 'neg')}>
                        {formatGoldCompact(r.gold)}
                      </div>
                      <div className="num text-muted-foreground">—</div>
                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          className="link-action"
                          onClick={() => setEditingSession({ session: s, items: r.items })}
                        >
                          editar
                        </button>
                        <button
                          type="button"
                          className="link-danger"
                          onClick={() => onDeleteSession(s, r.items)}
                        >
                          apagar
                        </button>
                      </div>
                    </div>
                  );
                }
                if (r.kind === 'sale') {
                  const i = r.item;
                  const from = activityOf(sessionOf(i.session_id)?.activity_id ?? '')?.name;
                  return (
                    <div
                      key={`v-${i.id}`}
                      ref={i.id === focusId ? focusedRowRef : undefined}
                      className={cn('sheet-row', ledgerCols, i.id === focusId && FOCUS_ROW)}
                    >
                      <div className="num text-left text-muted-foreground">{formatTime(i.sold_at!)}</div>
                      <div className="text-xs text-muted-foreground">Venda</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemIcon name={i.item_name} size={24} />
                          <span className="truncate">
                            {i.item_name} <span className="text-muted-foreground">× {i.quantity}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {i.sold_currency === 'tc'
                            ? `${Number(i.sold_price) * i.quantity} TC`
                            : 'em gold'}
                          {from && ` · drop de ${from}`}
                        </div>
                      </div>
                      <div className="num text-muted-foreground">—</div>
                      <div className="num pos">{formatGoldCompact(r.gold)}</div>
                      <div className="num text-muted-foreground">—</div>
                      <div className="flex justify-end">
                        <button type="button" className="link-action" onClick={() => navigate('/inventario')}>
                          estoque
                        </button>
                      </div>
                    </div>
                  );
                }
                const e = r.expense;
                const noRate = e.currency === 'tc' && !rateForDate(rates, e.occurred_at);
                return (
                  <div key={`e-${e.id}`} className={cn('sheet-row', ledgerCols)}>
                    <div className="num text-left text-muted-foreground">—</div>
                    <div className="text-xs text-muted-foreground">Despesa</div>
                    <div className="min-w-0">
                      <div className="truncate">{e.description || EXPENSE_LABEL[e.category]}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {EXPENSE_LABEL[e.category]}
                        {e.currency === 'tc' && ` · ${e.amount} TC${noRate ? ' (sem taxa)' : ''}`}
                      </div>
                    </div>
                    <div className="num text-muted-foreground">—</div>
                    <div className="num text-muted-foreground">—</div>
                    <div className="num neg">
                      {noRate ? `${e.amount} TC` : formatGoldCompact(r.gold)}
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <button type="button" className="link-action" onClick={() => setEditingExpense(e)}>
                        editar
                      </button>
                      <button type="button" className="link-danger" onClick={() => onDeleteExpense(e)}>
                        apagar
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {ledger.length > 0 && (
              <div className={cn('grid gap-3 px-3 py-2 border-t-2 border-foreground/20 bg-muted text-sm font-semibold', ledgerCols)}>
                <div />
                <div className="col-span-2">Total do dia</div>
                <div className="num">{dayMinutes}m</div>
                <div className="num pos">{formatGoldCompact(dayIncome)}</div>
                <div className={cn('num', dayExpenseGold > 0 && 'neg')}>
                  {dayExpenseGold > 0 ? formatGoldCompact(dayExpenseGold) : '0'}
                </div>
                <div />
              </div>
            )}
          </div>

          <StatStrip>
            <StatCard label="Entradas" value={formatGoldCompact(dayIncome)} tone="positive" />
            <StatCard
              label="Saídas"
              value={dayExpenseGold > 0 ? `-${formatGoldCompact(dayExpenseGold)}` : '0'}
              tone={dayExpenseGold > 0 ? 'negative' : 'default'}
              hint={dayExpenseTcNoRate > 0 ? `+ ${dayExpenseTcNoRate} TC sem taxa` : undefined}
            />
            <StatCard
              label="Saldo"
              value={formatGoldCompact(dayNet)}
              tone={dayNet > 0 ? 'positive' : dayNet < 0 ? 'negative' : 'default'}
              hint={dayNetBrl != null ? `≈ ${formatBRL(dayNetBrl)}` : 'sem taxa do mês'}
            />
            <StatCard
              label="Tempo jogado"
              value={`${Math.floor(dayMinutes / 60)}h ${String(dayMinutes % 60).padStart(2, '0')}m`}
            />
          </StatStrip>
        </section>
      </div>

      <SessionModal
        open={selected != null || editingSession != null}
        activity={selected}
        editing={editingSession}
        defaultDay={day}
        onClose={() => {
          setSelected(null);
          setEditingSession(null);
        }}
      />
      <ExpenseModal
        open={expenseOpen || editingExpense != null}
        editing={editingExpense}
        defaultDay={day}
        onClose={() => {
          setExpenseOpen(false);
          setEditingExpense(null);
        }}
      />
    </div>
  );
}
