import { cn } from '@/lib/cn';

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** cor do valor: entrada (verde), saída (vermelho) ou neutro */
  tone?: 'default' | 'positive' | 'negative';
  className?: string;
}

/** Célula de indicador (KPI) no estilo de relatório financeiro. */
export function StatCard({ label, value, hint, tone = 'default', className }: Props) {
  return (
    <div className={cn('bg-card px-3.5 py-3', className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className={cn(
          'num text-left text-xl font-medium',
          tone === 'positive' && 'pos',
          tone === 'negative' && 'neg',
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

/** Faixa de KPIs separados por linhas finas, como uma linha de totais. */
export function StatStrip({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      className="grid gap-px bg-border border border-border rounded-sm overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}
