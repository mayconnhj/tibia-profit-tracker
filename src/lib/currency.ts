import type { MonthlyRate, Session, SessionItem, Expense } from '@/types/database';

/**
 * Converte string de data do banco em Date no fuso LOCAL.
 * "2026-09-01" (coluna date) é interpretado por `new Date()` como meia-noite UTC,
 * que no Brasil vira 31/08 21:00 — por isso datas puras são montadas à mão.
 */
export function toLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(date);
}

/** "YYYY-MM-DD" no fuso local (não usar toISOString, que é UTC). */
export function localDateKey(date: string | Date = new Date()): string {
  const d = toLocalDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Retorna a taxa que se aplica a uma data. */
export function rateForDate(rates: MonthlyRate[], date: string | Date): MonthlyRate | null {
  const d = toLocalDate(date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return rates.find((r) => r.year === y && r.month === m) ?? null;
}

/** Quantos gold vale 1 TC na taxa; 0 se não houver taxa válida. */
function tcToGold(rate: MonthlyRate | null): number {
  const v = Number(rate?.tc_to_gold);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/**
 * Ganho "da sessão em si" em gold: profit + service convertido pela taxa do
 * mês da sessão. Itens NÃO entram aqui — item conta no mês da venda
 * (ver soldItemGold).
 */
export function sessionBaseGold(session: Session, rate: MonthlyRate | null): number {
  return Number(session.profit_gold ?? 0) + Number(session.service_tc ?? 0) * tcToGold(rate);
}

/** true se o item já foi vendido (tem preço, moeda e data de venda). */
export function isSold(item: SessionItem): boolean {
  return item.sold_at != null && item.sold_price != null && item.sold_currency != null;
}

/**
 * Valor em gold de um item vendido, usando a taxa do mês da VENDA.
 * Item pendente vale 0.
 */
export function soldItemGold(item: SessionItem, rates: MonthlyRate[]): number {
  if (!isSold(item)) return 0;
  const total = Number(item.sold_price) * Number(item.quantity);
  if (item.sold_currency === 'gold') return total;
  return total * tcToGold(rateForDate(rates, item.sold_at!));
}

/** Converte uma despesa pra gold usando a taxa do mês. */
export function expenseAsGold(expense: Expense, rate: MonthlyRate | null): number {
  if (expense.currency === 'gold') return Number(expense.amount);
  return Number(expense.amount) * tcToGold(rate);
}

/** Converte gold → BRL pela taxa; null se a taxa não permitir conversão. */
export function goldToBrl(gold: number, rate: MonthlyRate | null): number | null {
  const perTc = tcToGold(rate);
  const brl = Number(rate?.tc_to_brl);
  if (!perTc || !Number.isFinite(brl) || !Number.isFinite(gold)) return null;
  return (gold / perTc) * brl;
}

/** Formata BRL em reais. */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(value) ? value : 0,
  );
}

/** Dias de calendário que faltam até o último dia do mês (0 = hoje é o último dia). */
export function daysUntilEndOfMonth(now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.round((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Mês travado: flag do banco OU já passou o grace period de 7 dias após o fim do mês. */
export function isRateLocked(rate: MonthlyRate, now = new Date()): boolean {
  if (rate.locked) return true;
  const graceEnd = new Date(rate.year, rate.month, 1 + 7); // 1º dia do mês seguinte + 7
  return now >= graceEnd;
}
