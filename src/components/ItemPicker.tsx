import * as React from 'react';
import { createPortal } from 'react-dom';
import { ItemIcon } from '@/components/ItemIcon';
import { groupsForActivity, findCatalogItem, type CatalogItem } from '@/lib/items';
import { cn } from '@/lib/cn';

interface Props {
  value: string;
  onChange: (name: string) => void;
  /** nome da atividade: grupos que combinam com ela aparecem primeiro */
  activityName?: string;
  placeholder?: string;
}

/**
 * Campo de nome do item com sugestões do catálogo (imagem + nome), agrupadas por
 * quest. Aceita texto livre pra itens fora do catálogo.
 * A lista vai num portal com position: fixed porque o corpo do modal tem
 * overflow-y-auto e cortaria um dropdown absoluto.
 */
export function ItemPicker({ value, onChange, activityName, placeholder }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  const query = value.trim().toLowerCase();
  const groups = React.useMemo(
    () =>
      groupsForActivity(activityName)
        .map((g) => ({
          ...g,
          items: query ? g.items.filter((i) => i.name.toLowerCase().includes(query)) : g.items,
        }))
        .filter((g) => g.items.length > 0),
    [activityName, query],
  );
  const flat = React.useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const exact = findCatalogItem(value);
  const showList = open && flat.length > 0 && !(exact && flat.length === 1);

  // posição do dropdown acompanha o input (scroll do modal, resize)
  React.useLayoutEffect(() => {
    if (!open) return;
    const update = () => inputRef.current && setRect(inputRef.current.getBoundingClientRect());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  // mantém a opção ativa visível ao navegar pelo teclado
  React.useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function choose(item: CatalogItem) {
    onChange(item.name);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) {
      if (e.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (flat[active]) choose(flat[active]);
    } else if (e.key === 'Escape') {
      // fecha só a lista, não o modal (o Modal escuta Escape no window)
      e.stopPropagation();
      setOpen(false);
    }
  }

  // de-aninhado pra saber o índice global de cada item dentro dos grupos
  let idx = -1;

  // abre pra baixo; se não couber, abre pra cima
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
  const openUp = rect ? spaceBelow < 220 && rect.top > spaceBelow : false;
  const maxH = rect ? Math.min(288, (openUp ? rect.top : spaceBelow) - 12) : 288;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2">
        <ItemIcon name={value} size={24} className={exact ? '' : 'opacity-60'} />
      </span>
      <input
        ref={inputRef}
        className="input pl-8"
        value={value}
        placeholder={placeholder ?? 'Nome do item'}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList &&
        rect &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            // mousedown no lugar do click: não deixa o input perder o foco antes de escolher
            onMouseDown={(e) => e.preventDefault()}
            className="fixed z-[60] overflow-y-auto rounded-sm border border-border bg-card shadow-xl"
            style={{
              left: rect.left,
              width: Math.max(rect.width, 280),
              maxHeight: maxH,
              ...(openUp ? { bottom: window.innerHeight - rect.top + 2 } : { top: rect.bottom + 2 }),
            }}
          >
            {groups.map((g) => (
              <div key={g.id}>
                <div className="sticky top-0 bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                  {g.label}
                </div>
                {g.items.map((it) => {
                  idx += 1;
                  const i = idx;
                  return (
                    <div
                      key={it.name}
                      data-idx={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(it)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 px-2 py-1 text-sm',
                        i === active && 'bg-highlight',
                      )}
                    >
                      <ItemIcon name={it.name} size={24} />
                      <span className="flex-1 truncate">{it.name}</span>
                      {it.note && (
                        <span className="text-[10px] text-muted-foreground">{it.note}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
