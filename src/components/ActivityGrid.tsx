import * as React from 'react';
import { cn } from '@/lib/cn';
import type { Activity } from '@/types/database';

/** Cor da atividade vira só um marcador discreto (não pinta o card inteiro). */
export const ACTIVITY_COLOR: Record<string, string> = {
  purple: '#5b4fb3',
  teal: '#0f766e',
  coral: '#b4502a',
  blue: '#1f4e8c',
  amber: '#9a6a12',
  green: '#2f7a3f',
  pink: '#a3325f',
  gray: '#6b7280',
};

export const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  hunt: 'Hunt',
  quest: 'Quest',
  boss: 'Boss',
  mini_boss: 'Mini boss',
  bazaar: 'Bazaar',
  other: 'Outro',
};

export function ColorMark({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-[1px] shrink-0"
      style={{ background: ACTIVITY_COLOR[color] ?? ACTIVITY_COLOR.gray }}
    />
  );
}

interface Props {
  activities: Activity[];
  onSelect: (a: Activity) => void;
  /** Nova ordem (ids). Sem ela a lista não é arrastável. */
  onReorder?: (orderedIds: string[]) => void;
}

/** Move o item `from` pra ficar antes da posição `to` (0..length). */
function moveTo<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to > from ? to - 1 : to, 0, it);
  return next;
}

export function ActivityGrid({ activities, onSelect, onReorder }: Props) {
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  // posição de inserção (0..length): a linha-guia aparece acima desse índice
  const [dropAt, setDropAt] = React.useState<number | null>(null);
  const canDrag = onReorder != null && activities.length > 1;

  function commit(from: number, to: number) {
    if (!onReorder || to === from || to === from + 1) return;
    onReorder(moveTo(activities, from, to).map((a) => a.id));
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    if (dragIdx == null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const r = e.currentTarget.getBoundingClientRect();
    setDropAt(e.clientY < r.top + r.height / 2 ? idx : idx + 1);
  }

  function endDrag() {
    setDragIdx(null);
    setDropAt(null);
  }

  // teclado: Alt+↑ / Alt+↓ com o foco na atividade move ela
  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (!canDrag || !e.altKey) return;
    if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      commit(idx, idx - 1);
    } else if (e.key === 'ArrowDown' && idx < activities.length - 1) {
      e.preventDefault();
      commit(idx, idx + 2);
    }
  }

  return (
    <div
      className="sheet"
      // saiu da lista inteira (não só de uma linha pra outra): some a linha-guia
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropAt(null);
      }}
    >
      {activities.map((a, idx) => (
        <div
          key={a.id}
          draggable={canDrag}
          onDragStart={(e) => {
            setDragIdx(idx);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', a.id); // Firefox só arrasta com setData
          }}
          onDragOver={(e) => onDragOver(e, idx)}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIdx != null && dropAt != null) commit(dragIdx, dropAt);
            endDrag();
          }}
          onDragEnd={endDrag}
          className={cn(
            'relative border-b border-border last:border-b-0',
            dragIdx === idx && 'opacity-40',
          )}
        >
          {dropAt === idx && <DropLine position="top" />}
          {dropAt === activities.length && idx === activities.length - 1 && (
            <DropLine position="bottom" />
          )}
          <button
            type="button"
            onClick={() => onSelect(a)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={cn(
              'w-full grid items-center gap-2.5 px-3 py-2 text-left hover:bg-highlight transition-colors',
              canDrag ? 'grid-cols-[10px_28px_1fr_auto]' : 'grid-cols-[28px_1fr_auto]',
            )}
            title={canDrag ? 'Clique pra registrar · arraste (ou Alt+↑/↓) pra reordenar' : undefined}
          >
            {canDrag && (
              <span
                aria-hidden
                className="cursor-grab text-muted-foreground/60 leading-none select-none tracking-[-2px]"
              >
                ⋮⋮
              </span>
            )}
            <span className="kbd">{idx < 9 ? idx + 1 : '·'}</span>
            <span className="flex items-center gap-2 min-w-0">
              <ColorMark color={a.color} />
              <span className="text-sm font-medium truncate" title={a.name}>
                {a.name}
              </span>
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {ACTIVITY_TYPE_LABEL[a.type] ?? a.type}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

function DropLine({ position }: { position: 'top' | 'bottom' }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-accent',
        position === 'top' ? '-top-px' : '-bottom-px',
      )}
    />
  );
}
