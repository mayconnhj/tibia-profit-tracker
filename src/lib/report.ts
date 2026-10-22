import {
  rateForDate,
  soldItemGold,
  isSold,
  expenseAsGold,
  localDateKey,
  toLocalDate,
} from '@/lib/currency';
import type { Activity, Expense, MonthlyRate, Session, SessionItem } from '@/types/database';

/** De onde veio o dinheiro. */
export type RevenueSource = 'hunt' | 'quest' | 'service' | 'bag';

export const REVENUE_SOURCES: { id: RevenueSource; label: string; hint: string }[] = [
  { id: 'hunt', label: 'Profit de hunt', hint: 'profit das sessões de atividades tipo hunt' },
  { id: 'quest', label: 'Profit de quest / boss', hint: 'profit das demais atividades (quest, boss, mini boss…)' },
  { id: 'service', label: 'Service (TC)', hint: 'service em TC convertido pela taxa do mês' },
  { id: 'bag', label: 'Bag / itens vendidos', hint: 'itens dropados, no mês em que foram vendidos' },
];

/** Uma parcela de receita do mês, já em gold. */
export interface RevenueEntry {
  source: RevenueSource;
  activityId: string;
  /** dia (YYYY-MM-DD, local) em que o valor conta */
  day: string;
  gold: number;
}

/** "2026-09" -> intervalo [início, fim) em hora local. */
export function monthRange(ym: string): { start: Date; end: Date } {
  const [y, m] = ym.split('-').map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function isValidMonthKey(s: string | null): s is string {
  return !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export interface MonthReport {
  sessions: Session[];
  expenses: Expense[];
  soldItems: SessionItem[];
  entries: RevenueEntry[];
  expenseGold: number;
}

/**
 * Tudo que entra no mês `ym`, quebrado por origem.
 * Regras do domínio: sessão conta no mês dela (service pela taxa desse mês);
 * item vendido conta no mês da VENDA, pela taxa do mês da venda.
 */
export function buildMonthReport(
  ym: string,
  data: {
    sessions: Session[];
    items: SessionItem[];
    expenses: Expense[];
    activities: Activity[];
    rates: MonthlyRate[];
  },
): MonthReport {
  const { start, end } = monthRange(ym);
  const inMonth = (d: Date) => d >= start && d < end;
  const typeOf = new Map(data.activities.map((a) => [a.id, a.type]));
  const sessionById = new Map(data.sessions.map((s) => [s.id, s]));

  const sessions = data.sessions.filter((s) => inMonth(new Date(s.started_at)));
  const expenses = data.expenses.filter((e) => inMonth(toLocalDate(e.occurred_at)));
  const soldItems = data.items.filter((i) => isSold(i) && inMonth(new Date(i.sold_at!)));

  const entries: RevenueEntry[] = [];
  for (const s of sessions) {
    const day = localDateKey(s.started_at);
    const profit = Number(s.profit_gold ?? 0);
    if (profit !== 0) {
      entries.push({
        source: typeOf.get(s.activity_id) === 'hunt' ? 'hunt' : 'quest',
        activityId: s.activity_id,
        day,
        gold: profit,
      });
    }
    const rate = rateForDate(data.rates, s.started_at);
    const perTc = Number(rate?.tc_to_gold) > 0 ? Number(rate!.tc_to_gold) : 0;
    const service = Number(s.service_tc ?? 0) * perTc;
    if (service !== 0) {
      entries.push({ source: 'service', activityId: s.activity_id, day, gold: service });
    }
  }
  for (const i of soldItems) {
    const s = sessionById.get(i.session_id);
    entries.push({
      source: 'bag',
      activityId: s?.activity_id ?? '',
      day: localDateKey(i.sold_at!),
      gold: soldItemGold(i, data.rates),
    });
  }

  const expenseGold = expenses.reduce(
    (sum, e) => sum + expenseAsGold(e, rateForDate(data.rates, e.occurred_at)),
    0,
  );

  return { sessions, expenses, soldItems, entries, expenseGold };
}

/** Soma por origem (sempre todas as origens, pra tabela de composição). */
export function totalsBySource(entries: RevenueEntry[]): Record<RevenueSource, number> {
  const t: Record<RevenueSource, number> = { hunt: 0, quest: 0, service: 0, bag: 0 };
  for (const e of entries) t[e.source] += e.gold;
  return t;
}
