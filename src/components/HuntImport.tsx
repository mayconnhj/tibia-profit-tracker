import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ItemIcon } from '@/components/ItemIcon';
import { parseHuntAnalyser, splitShare, type ParsedHunt } from '@/lib/partyHunt';
import { findCatalogItem } from '@/lib/items';
import { formatGoldCompact, formatGoldLong } from '@/lib/goldFormat';
import { cn } from '@/lib/cn';
import type { Character } from '@/types/database';

/** O que o usuário confirmou aplicar nos campos do lançamento. */
export interface HuntImportValues {
  profit?: number;
  durationMin?: number;
  startedAt?: Date;
  characterId?: string;
  items?: { name: string; quantity: number }[];
  note?: string;
}

interface Props {
  text: string;
  onTextChange: (text: string) => void;
  characters: Character[];
  onApply: (values: HuntImportValues) => void;
  onDiscard: () => void;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

function formatDuration(min: number) {
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

/**
 * Painel "colar o split": lê o texto do Party Hunt / Hunt Analyser e mostra uma
 * prévia com checkbox por campo. Nada é preenchido até clicar em "Aplicar".
 */
export function HuntImport({ text, onTextChange, characters, onApply, onDiscard }: Props) {
  const parsed: ParsedHunt | null = React.useMemo(() => parseHuntAnalyser(text), [text]);
  const players = parsed?.kind === 'party' ? parsed.members.length : 1;

  const [divisor, setDivisor] = React.useState(String(players));
  const [use, setUse] = React.useState({
    profit: true,
    duration: true,
    start: true,
    character: true,
    items: true,
  });

  // novo texto colado: divisor volta pro nº de jogadores
  React.useEffect(() => setDivisor(String(players)), [players, text]);

  // personagem cadastrado que aparece no split
  const matchedChar = React.useMemo(() => {
    if (!parsed) return undefined;
    const names = new Set(parsed.members.map((m) => norm(m.name)));
    return characters.find((c) => names.has(norm(c.name)));
  }, [parsed, characters]);

  // no solo, só os itens do catálogo (o resto é loot comum que já está no Balance)
  const catalogItems = React.useMemo(
    () =>
      (parsed?.lootedItems ?? [])
        .map((i) => ({ item: findCatalogItem(i.name), quantity: i.quantity }))
        .filter((i): i is { item: NonNullable<typeof i.item>; quantity: number } => !!i.item)
        .map((i) => ({ name: i.item.name, quantity: i.quantity })),
    [parsed],
  );

  const div = Math.max(1, Math.round(Number(divisor)) || 1);
  const share = parsed ? splitShare(parsed.balance, div) : 0;

  function apply() {
    if (!parsed) return;
    onApply({
      profit: use.profit ? share : undefined,
      durationMin: use.duration && parsed.durationMin ? parsed.durationMin : undefined,
      startedAt: use.start && parsed.startedAt ? parsed.startedAt : undefined,
      characterId: use.character && matchedChar ? matchedChar.id : undefined,
      items: use.items && catalogItems.length > 0 ? catalogItems : undefined,
      note:
        parsed.kind === 'party'
          ? `Split: ${formatGoldLong(parsed.balance)} ÷ ${div}`
          : `Hunt Analyser: balance ${formatGoldLong(parsed.balance)}`,
    });
  }

  const toggle = (k: keyof typeof use) => setUse((u) => ({ ...u, [k]: !u[k] }));

  return (
    <div className="sheet">
      <div className="sheet-title py-1.5">
        <div className="title">Importar do Party Hunt / Hunt Analyser</div>
        <button type="button" className="link-action" onClick={onDiscard}>
          fechar
        </button>
      </div>

      {!parsed ? (
        <div className="p-3 space-y-1.5">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={'No Tibia: Party Hunt Analyser → "Copy to clipboard". Cole aqui (Ctrl+V).'}
            className="input h-24 py-1.5 font-mono text-xs resize-none"
            data-hunt-import
          />
          {text.trim() && (
            <div className="text-xs neg">
              Não reconheci esse texto. Precisa ter as linhas “Session data: From …” e “Balance: …”.
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="sheet-head grid-cols-[20px_110px_1fr]">
            <div />
            <div>Campo</div>
            <div>Valor lido</div>
          </div>

          <PreviewRow checked={use.profit} onToggle={() => toggle('profit')} label="Profit (sua parte)">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="num text-left font-medium pos">{formatGoldLong(share)}</span>
              <span className="text-muted-foreground text-xs">({formatGoldCompact(share)})</span>
              <span className="text-xs text-muted-foreground">
                = balance <span className="num">{formatGoldLong(parsed.balance)}</span> ÷
              </span>
              <Input
                type="number"
                min={1}
                value={divisor}
                onChange={(e) => setDivisor(e.target.value)}
                className="h-6 w-14 px-1 text-center text-xs font-mono"
                aria-label="Dividir por"
              />
              <span className="text-xs text-muted-foreground">
                {parsed.kind === 'party' ? `jogador(es) · ${players} no split` : 'hunt solo'}
              </span>
            </div>
          </PreviewRow>

          <PreviewRow
            checked={use.duration}
            onToggle={() => toggle('duration')}
            label="Tempo"
            disabled={!parsed.durationMin}
          >
            {parsed.durationMin ? (
              <span className="num text-left">
                {formatDuration(parsed.durationMin)} ({parsed.durationMin} min)
              </span>
            ) : (
              <span className="text-muted-foreground">não encontrado</span>
            )}
          </PreviewRow>

          <PreviewRow
            checked={use.start}
            onToggle={() => toggle('start')}
            label="Início"
            disabled={!parsed.startedAt}
          >
            {parsed.startedAt ? (
              <span className="num text-left">
                {parsed.startedAt.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : (
              <span className="text-muted-foreground">não encontrado</span>
            )}
          </PreviewRow>

          {parsed.kind === 'party' && (
            <PreviewRow
              checked={use.character}
              onToggle={() => toggle('character')}
              label="Personagem"
              disabled={!matchedChar}
            >
              {matchedChar ? (
                <span className="font-medium">{matchedChar.name}</span>
              ) : (
                <span className="text-muted-foreground">
                  nenhum personagem cadastrado aparece no split
                </span>
              )}
            </PreviewRow>
          )}

          {catalogItems.length > 0 && (
            <PreviewRow checked={use.items} onToggle={() => toggle('items')} label="Itens (pendentes)">
              <div className="flex flex-wrap gap-2">
                {catalogItems.map((i) => (
                  <span key={i.name} className="inline-flex items-center gap-1 text-xs">
                    <ItemIcon name={i.name} size={24} /> {i.name}
                    {i.quantity > 1 && <span className="text-muted-foreground">× {i.quantity}</span>}
                  </span>
                ))}
              </div>
            </PreviewRow>
          )}

          {parsed.kind === 'party' && (
            <div className="border-t border-border bg-muted/50 px-3 py-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Party
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-xs">
                {parsed.members.map((m) => {
                  const mine = matchedChar && norm(matchedChar.name) === norm(m.name);
                  return (
                    <React.Fragment key={m.name}>
                      <span className={cn(mine && 'font-semibold')}>
                        {m.name}
                        {m.leader && <span className="text-muted-foreground"> (leader)</span>}
                        {mine && <span className="text-muted-foreground"> · você</span>}
                      </span>
                      <span className={cn('num', m.balance >= 0 ? 'pos' : 'neg')}>
                        {formatGoldLong(m.balance)}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              Service em TC continua manual. Depois de aplicar, tudo segue editável.
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onTextChange('')}>
                Colar outro
              </Button>
              <Button size="sm" variant="primary" onClick={apply}>
                Aplicar nos campos
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PreviewRow({
  checked,
  onToggle,
  label,
  disabled,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'grid grid-cols-[20px_110px_1fr] items-center gap-3 px-3 py-1.5 border-b border-border text-sm',
        disabled ? 'opacity-60' : 'cursor-pointer hover:bg-highlight',
      )}
    >
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={onToggle}
        className="accent-[hsl(var(--accent))]"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </label>
  );
}
