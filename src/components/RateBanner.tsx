import { Link } from 'react-router-dom';
import { daysUntilEndOfMonth } from '@/lib/currency';
import { useMonthlyRates } from '@/hooks/useMonthlyRates';

/**
 * Banner amarelo que aparece SOMENTE quando:
 * - não existe taxa pro mês atual, OU
 * - faltam ≤2 dias pro fim do mês E a taxa atual não é atualizada há ≥3 dias
 */
export function RateBanner() {
  const { data: rates, isSuccess } = useMonthlyRates();
  // enquanto carrega (ou se a query falhou) não dá pra saber se existe taxa: não pisca o banner
  if (!isSuccess) return null;

  const now = new Date();
  const current = rates.find(
    (r) => r.year === now.getFullYear() && r.month === now.getMonth() + 1,
  );
  const days = daysUntilEndOfMonth(now);
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now);

  const noCurrentRate = !current;
  const stale = current
    ? (now.getTime() - new Date(current.updated_at).getTime()) / (1000 * 60 * 60 * 24) >= 3
    : false;

  const shouldShow = noCurrentRate || (days <= 2 && stale);
  if (!shouldShow) return null;

  return (
    <div className="flex items-center gap-3 mb-4 border border-border border-l-4 border-l-warning bg-card px-4 py-2.5 rounded-sm">
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-warning">
          {noCurrentRate
            ? `Sem taxa cadastrada para ${monthName}`
            : days === 0
              ? `${monthName} fecha hoje`
              : `${monthName} fecha em ${days} dia${days === 1 ? '' : 's'}`}
        </div>
        <div className="text-xs text-muted-foreground">
          Registre o preço da TC do mês (em gold e em BRL) antes de virar. Depois do dia 7 do mês
          seguinte, o valor congela.
        </div>
      </div>
      <Link
        to="/config"
        className="btn btn-sm"
      >
        Definir taxa
      </Link>
    </div>
  );
}
