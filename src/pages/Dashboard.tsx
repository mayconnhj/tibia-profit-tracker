import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { StatCard, StatStrip } from '@/components/ui/StatCard';
import { cn, capFirst } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSessions, useSessionItems } from '@/hooks/useSessions';
import { useExpenses } from '@/hooks/useExpenses';
import { useAllActivities } from '@/hooks/useActivities';
import { useMonthlyRates } from '@/hooks/useMonthlyRates';
import { rateForDate, expenseAsGold, goldToBrl, formatBRL } from '@/lib/currency';
import {
  REVENUE_SOURCES,
  buildMonthReport,
  totalsBySource,
  monthKey,
  monthRange,
  shiftMonth,
  isValidMonthKey,
  type RevenueSource,
} from '@/lib/report';
import { formatGoldCompact } from '@/lib/goldFormat';
import { exportFullXlsx, exportSessionsCsv, exportBackupJson } from '@/lib/export';

export function DashboardPage() {
  const { data: sessions = [] } = useSessions();
  const { data: items = [] } = useSessionItems();
  const { data: expenses = [] } = useExpenses();
  // inclui arquivadas: sessões antigas continuam com nome no ranking/export
  const { data: activities = [] } = useAllActivities();
  const { data: rates = [] } = useMonthlyRates();

  // Mês exibido vem da URL (?mes=2026-09) pra dar pra voltar/compartilhar; padrão = mês atual
  const [params, setParams] = useSearchParams();
  const currentYm = monthKey();
  const ym = isValidMonthKey(params.get('mes')) ? params.get('mes')! : currentYm;
  const setYm = (next: string) =>
    setParams(next === currentYm ? {} : { mes: next }, { replace: true });
  const isCurrentMonth = ym === currentYm;
  const { start: monthStart } = monthRange(ym);

  // Origens incluídas na receita (filtro). Despesas não são filtradas.
  const [included, setIncluded] = React.useState<Set<RevenueSource>>(
    () => new Set(REVENUE_SOURCES.map((r) => r.id)),
  );
  const toggleSource = (id: RevenueSource) =>
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allIncluded = included.size === REVENUE_SOURCES.length;

  const report = React.useMemo(
    () => buildMonthReport(ym, { sessions, items, expenses, activities, rates }),
    [ym, sessions, items, expenses, activities, rates],
  );
  const monthSessions = report.sessions;
  const monthExpenses = report.expenses;
  const bySource = totalsBySource(report.entries);
  const grossAll = Object.values(bySource).reduce((a, b) => a + b, 0);
  const entries = report.entries.filter((e) => included.has(e.source));

  // Totais (receita respeita o filtro)
  const totalGold = entries.reduce((sum, e) => sum + e.gold, 0);
  const totalExpenseGold = report.expenseGold;
  const totalMinutes = monthSessions.reduce((s, x) => s + x.duration_min, 0);
  const netGold = totalGold - totalExpenseGold;
  const goldPerHour = totalMinutes > 0 ? (totalGold / totalMinutes) * 60 : 0;

  const monthRate = rateForDate(rates, monthStart);
  const netBrl = goldToBrl(netGold, monthRate);

  // Ranking gold/hora por atividade (horas = tempo das sessões da atividade no mês)
  const byActivity = new Map<string, { gold: number; minutes: number; name: string }>();
  const ensure = (activityId: string) => {
    let v = byActivity.get(activityId);
    if (!v) {
      v = { gold: 0, minutes: 0, name: activities.find((x) => x.id === activityId)?.name ?? '(?)' };
      byActivity.set(activityId, v);
    }
    return v;
  };
  for (const s of monthSessions) ensure(s.activity_id).minutes += s.duration_min;
  for (const e of entries) if (e.activityId) ensure(e.activityId).gold += e.gold;
  const ranking = Array.from(byActivity.entries())
    .filter(([, v]) => v.gold !== 0)
    .map(([id, v]) => ({
      id,
      name: v.name,
      goldPerHour: v.minutes > 0 ? (v.gold / v.minutes) * 60 : 0,
      totalGold: v.gold,
      hours: v.minutes / 60,
    }))
    .sort((a, b) => b.goldPerHour - a.goldPerHour);

  const bestActivity = ranking[0];

  // Resultado acumulado por dia (receita filtrada − despesas)
  const dailyMap = new Map<string, number>();
  for (const e of entries) dailyMap.set(e.day, (dailyMap.get(e.day) ?? 0) + e.gold);
  for (const e of monthExpenses) {
    const cur = dailyMap.get(e.occurred_at) ?? 0;
    dailyMap.set(e.occurred_at, cur - expenseAsGold(e, rateForDate(rates, e.occurred_at)));
  }
  const sortedDays = Array.from(dailyMap.keys()).sort();
  let acc = 0;
  const cumulative = sortedDays.map((day) => {
    acc += dailyMap.get(day) ?? 0;
    // em kk com 1 casa: (acc / 1e6) * 10 arredondado / 10
    return { day: day.slice(8, 10), value: Math.round((acc / 1_000_000) * 10) / 10 };
  });

  // Export
  function onExportCsv() {
    exportSessionsCsv(
      sessions.map((s) => ({
        ...s,
        activityName: activities.find((a) => a.id === s.activity_id)?.name ?? '',
      })),
    );
  }
  function onExportXlsx() {
    exportFullXlsx({ sessions, items, expenses, activities, rates }).catch((e) =>
      alert(`Erro ao exportar XLSX: ${(e as Error).message}`),
    );
  }
  function onExportJson() {
    exportBackupJson({ sessions, items, expenses, activities, rates });
  }

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    monthStart,
  );

  const tone = (v: number): 'positive' | 'negative' | 'default' =>
    v > 0 ? 'positive' : v < 0 ? 'negative' : 'default';
  const share = (v: number) => (totalGold > 0 ? `${((v / totalGold) * 100).toFixed(1)}%` : '—');
  const tableCols = 'grid-cols-[minmax(0,1fr)_80px_110px_80px_110px]';
  const sourceCols = 'grid-cols-[20px_minmax(0,1fr)_110px_90px_160px]';

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-label">Relatório mensal</div>
          <div className="page-title">{capFirst(monthName)}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={() => setYm(shiftMonth(ym, -1))} aria-label="Mês anterior">
            ‹
          </Button>
          <Input
            type="month"
            value={ym}
            onChange={(e) => isValidMonthKey(e.target.value) && setYm(e.target.value)}
            className="h-7 w-[175px] text-xs font-mono"
            aria-label="Mês do relatório"
          />
          <Button
            size="sm"
            onClick={() => setYm(shiftMonth(ym, 1))}
            disabled={isCurrentMonth}
            aria-label="Mês seguinte"
          >
            ›
          </Button>
          <Button size="sm" onClick={() => setYm(currentYm)} disabled={isCurrentMonth}>
            Mês atual
          </Button>
          <span className="mx-1.5 h-5 w-px bg-border" />
          <span className="text-xs text-muted-foreground mr-1">Exportar</span>
          <Button size="sm" onClick={onExportCsv}>
            CSV
          </Button>
          <Button size="sm" onClick={onExportXlsx}>
            XLSX
          </Button>
          <Button size="sm" onClick={onExportJson}>
            JSON
          </Button>
        </div>
      </div>

      <StatStrip>
        <StatCard
          label={allIncluded ? 'Receita do mês' : 'Receita (filtrada)'}
          value={formatGoldCompact(totalGold)}
          tone={tone(totalGold)}
          hint={
            allIncluded
              ? `${report.entries.length} lançamento(s) de receita`
              : `de ${formatGoldCompact(grossAll)} no total`
          }
        />
        <StatCard
          label="Despesas"
          value={totalExpenseGold > 0 ? `-${formatGoldCompact(totalExpenseGold)}` : '0'}
          tone={totalExpenseGold > 0 ? 'negative' : 'default'}
          hint={`${monthExpenses.length} lançamento(s)`}
        />
        <StatCard
          label="Resultado líquido"
          value={formatGoldCompact(netGold)}
          tone={tone(netGold)}
          hint={netBrl != null ? `≈ ${formatBRL(netBrl)}` : 'sem taxa deste mês'}
        />
        <StatCard
          label="Gold/hora médio"
          value={formatGoldCompact(goldPerHour)}
          hint={`em ${(totalMinutes / 60).toFixed(1)}h · ${monthSessions.length} sessão(ões)`}
        />
      </StatStrip>

      <div className="sheet">
        <div className="sheet-title">
          <div className="title">Composição da receita</div>
          <span className="text-[11px] text-muted-foreground">
            marque o que entra nos totais, gráficos e detalhamento
          </span>
        </div>
        <div className={cn('sheet-head', sourceCols)}>
          <div />
          <div>Origem</div>
          <div className="text-right">Valor</div>
          <div className="text-right">% do total</div>
          <div />
        </div>
        {REVENUE_SOURCES.map((src) => {
          const v = bySource[src.id];
          const on = included.has(src.id);
          return (
            <label
              key={src.id}
              className={cn('sheet-row cursor-pointer', sourceCols, !on && 'text-muted-foreground')}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggleSource(src.id)}
                className="accent-[hsl(var(--accent))]"
              />
              <div>
                <div className={cn(on && 'font-medium')}>{src.label}</div>
                <div className="text-[11px] text-muted-foreground">{src.hint}</div>
              </div>
              <div className={cn('num', on && v > 0 && 'pos', !on && 'line-through')}>
                {formatGoldCompact(v)}
              </div>
              <div className="num text-muted-foreground">
                {grossAll > 0 ? `${((v / grossAll) * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="pl-2">
                <div className="h-1.5 bg-muted">
                  <div
                    className={cn('h-full', on ? 'bg-accent' : 'bg-input')}
                    style={{ width: `${grossAll > 0 ? Math.max(0, (v / grossAll) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </label>
          );
        })}
        <div
          className={cn(
            'grid gap-3 px-3 py-2 border-t-2 border-foreground/20 bg-muted text-sm font-semibold items-center',
            sourceCols,
          )}
        >
          <div />
          <div className="flex items-center gap-3">
            {allIncluded ? 'Total' : 'Total considerado'}
            {!allIncluded && (
              <button
                type="button"
                className="link-action font-normal"
                onClick={() => setIncluded(new Set(REVENUE_SOURCES.map((r) => r.id)))}
              >
                marcar todas
              </button>
            )}
          </div>
          <div className="num pos">{formatGoldCompact(totalGold)}</div>
          <div className="num">
            {grossAll > 0 ? `${((totalGold / grossAll) * 100).toFixed(1)}%` : '—'}
          </div>
          <div />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="sheet">
          <div className="sheet-title">
            <div className="title">Rentabilidade por atividade</div>
            <span className="text-[11px] text-muted-foreground">gold por hora jogada</span>
          </div>
          <div className="p-3">
            {ranking.length === 0 ? (
              <div className="sheet-empty">Sem dados neste mês.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ranking} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke="#e9e0d3" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatGoldCompact(v)}
                    fontSize={11}
                    stroke="#9a8e80"
                    tick={{ fill: '#7d7064' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    fontSize={11}
                    stroke="#9a8e80"
                    tick={{ fill: '#7d7064' }}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatGoldCompact(v) + '/h', 'Gold/hora']}
                    contentStyle={{ borderRadius: 2, fontSize: 12 }}
                  />
                  {/* sem animação: relatório estático, e a animação (rAF) não roda com a aba em segundo plano */}
                  <Bar dataKey="goldPerHour" fill="#7a4424" barSize={14} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {bestActivity && (
            <div className="px-3 py-2 border-t border-border bg-muted text-xs text-muted-foreground">
              Melhor retorno: <span className="font-medium text-foreground">{bestActivity.name}</span>{' '}
              — <span className="num">{formatGoldCompact(bestActivity.goldPerHour)}/h</span>
            </div>
          )}
        </div>

        <div className="sheet">
          <div className="sheet-title">
            <div className="title">Resultado acumulado</div>
            <span className="text-[11px] text-muted-foreground">líquido do mês, em kk</span>
          </div>
          <div className="p-3">
            {cumulative.length === 0 ? (
              <div className="sheet-empty">Sem dados neste mês.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cumulative} margin={{ top: 10, left: -10, right: 10 }}>
                  <CartesianGrid stroke="#e9e0d3" vertical={false} />
                  <XAxis dataKey="day" fontSize={11} stroke="#9a8e80" tick={{ fill: '#7d7064' }} />
                  <YAxis
                    fontSize={11}
                    tickFormatter={(v) => `${v}kk`}
                    stroke="#9a8e80"
                    tick={{ fill: '#7d7064' }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}kk`, 'Acumulado']}
                    labelFormatter={(d) => `Dia ${d}`}
                    contentStyle={{ borderRadius: 2, fontSize: 12 }}
                  />
                  <Line
                    type="linear"
                    dataKey="value"
                    stroke="#7a4424"
                    strokeWidth={2}
                    isAnimationActive={false}
                    // com 1 dia só a linha não tem o que desenhar: mostra o ponto
                    dot={cumulative.length === 1}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="sheet">
        <div className="sheet-title">
          <div className="title">Detalhamento por atividade</div>
        </div>
        <div className={cn('sheet-head', tableCols)}>
          <div>Atividade</div>
          <div className="text-right">Horas</div>
          <div className="text-right">Receita</div>
          <div className="text-right">% receita</div>
          <div className="text-right">Gold/h</div>
        </div>
        {ranking.length === 0 ? (
          <div className="sheet-empty">Sem dados neste mês.</div>
        ) : (
          <>
            {ranking.map((r) => (
              <div key={r.id} className={cn('sheet-row', tableCols)}>
                <div className="truncate">{r.name}</div>
                <div className="num text-muted-foreground">{r.hours.toFixed(1)}</div>
                <div className={cn('num', r.totalGold >= 0 ? 'pos' : 'neg')}>
                  {formatGoldCompact(r.totalGold)}
                </div>
                <div className="num text-muted-foreground">{share(r.totalGold)}</div>
                <div className="num font-medium">{formatGoldCompact(r.goldPerHour)}</div>
              </div>
            ))}
            <div className={cn('grid gap-3 px-3 py-2 border-t-2 border-foreground/20 bg-muted text-sm font-semibold', tableCols)}>
              <div>Total</div>
              <div className="num">{(totalMinutes / 60).toFixed(1)}</div>
              <div className="num pos">{formatGoldCompact(totalGold)}</div>
              <div className="num">{totalGold > 0 ? '100%' : '—'}</div>
              <div className="num">{formatGoldCompact(goldPerHour)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
