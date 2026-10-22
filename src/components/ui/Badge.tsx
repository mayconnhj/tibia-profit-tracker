import { cn } from '@/lib/cn';

interface Props {
  children: React.ReactNode;
  variant?: 'gold' | 'tc' | 'brl' | 'neutral' | 'warning' | 'success' | 'danger';
  className?: string;
}

// Etiquetas discretas, estilo tag de sistema contábil: fundo branco, borda e texto na cor.
const styles: Record<NonNullable<Props['variant']>, string> = {
  gold: 'border-[#c9a45c] text-[#7a5412]',
  tc: 'border-[#a9b4bd] text-[#3b5266]',
  brl: 'border-[#9cbc97] text-positive',
  neutral: 'border-input text-muted-foreground',
  warning: 'border-[#d8b26a] text-warning bg-[#fcf5e6]',
  success: 'border-[#9cbc97] text-positive bg-[#f2f6ec]',
  danger: 'border-[#e0a39d] text-negative bg-[#fdf3f2]',
};

export function Badge({ children, variant = 'neutral', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border bg-card px-1.5 py-px text-[10px] font-medium uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
