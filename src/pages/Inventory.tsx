import * as React from 'react';
import { Link } from 'react-router-dom';
import { SellItemModal } from '@/components/SellItemModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ColorMark } from '@/components/ActivityGrid';
import { ItemIcon } from '@/components/ItemIcon';
import { cn } from '@/lib/cn';
import { useSessionItems, useSessions, useDeleteItem } from '@/hooks/useSessions';
import { useAllActivities } from '@/hooks/useActivities';
import { useMonthlyRates } from '@/hooks/useMonthlyRates';
import { formatGoldCompact, formatGoldLong } from '@/lib/goldFormat';
import { localDateKey, soldItemGold, toLocalDate } from '@/lib/currency';
import type { SessionItem } from '@/types/database';

type Tab = 'pending' | 'sold';

/** Dias de calendário desde a data (ontem às 23h = 1 dia, não "hoje"). */
function daysSince(iso: string): number {
  const d = toLocalDate(localDateKey(iso));
  const today = toLocalDate(localDateKey());
  return Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Link pro lançamento do dia, com o item destacado (Home lê ?dia=&foco=). */
function ledgerHref(iso: string, itemId: string) {
  return `/?dia=${localDateKey(iso)}&foco=${itemId}`;
}

function daysBadge(d: number) {
  if (d === 0)
    return (
      <Badge variant="success" className="normal-case">
        hoje
      </Badge>
    );
  if (d <= 3)
    return (
      <Badge variant="neutral" className="normal-case">
        {d === 1 ? '1 dia' : `${d} dias`}
      </Badge>
    );
  if (d <= 15)
    return (
      <Badge variant="warning" className="normal-case">
        {d} dias
      </Badge>
    );
  return (
    <Badge variant="danger" className="normal-case">
      {d} dias
    </Badge>
  );
}

export function InventoryPage() {
  const [tab, setTab] = React.useState<Tab>('pending');
  const [selling, setSelling] = React.useState<SessionItem | null>(null);
  const { data: items = [] } = useSessionItems();
  const { data: sessions = [] } = useSessions();
  const { data: activities = [] } = useAllActivities();
  const { data: rates = [] } = useMonthlyRates();
  const del = useDeleteItem();

  const rows = React.useMemo(() => {
    const filtered =
      tab === 'pending'
        ? items.filter((i) => i.sold_at == null)
        : items
            .filter((i) => i.sold_at != null)
            .sort((a, b) => b.sold_at!.localeCompare(a.sold_at!));
    return filtered.map((i) => {
      const s = sessions.find((x) => x.id === i.session_id);
      const a = activities.find((x) => x.id === s?.activity_id);
      return { item: i, session: s, activity: a };
    });
  }, [items, sessions, activities, tab]);

  const pendingItems = items.filter((i) => i.sold_at == null);
  const soldItems = items.filter((i) => i.sold_at != null);
  const pendingCount = pendingItems.length;
  const soldCount = soldItems.length;
  const pendingUnits = pendingItems.reduce((s, i) => s + i.quantity, 0);
  const soldGold = soldItems.reduce((s, i) => s + soldItemGold(i, rates), 0);

  const cols =
    tab === 'pending'
      ? 'grid-cols-[minmax(0,2fr)_56px_90px_minmax(0,1.3fr)_100px_80px]'
      : 'grid-cols-[minmax(0,2fr)_56px_90px_minmax(0,1.3fr)_90px_110px_60px]';
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="space-y-3">
      <div>
        <div className="page-title">Estoque de itens</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Itens dropados aguardando venda não entram em nenhum cálculo até serem vendidos; a venda
          conta no mês em que acontece.
        </div>
      </div>

      <div className="sheet">
        <div className="sheet-title pb-0 items-end">
          <div className="flex items-center gap-4 pb-2 text-xs text-muted-foreground">
            <span className={cn(pendingCount > 0 && 'text-warning font-medium')}>
              {pendingCount === 0
                ? 'Nenhum item pendente'
                : `${pendingCount} ${pendingCount === 1 ? 'item pendente' : 'itens pendentes'}` +
                  (pendingUnits !== pendingCount ? ` (${pendingUnits} un.)` : '')}
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              {soldCount === 0 ? (
                'Nenhum vendido ainda'
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {soldCount} {soldCount === 1 ? 'vendido' : 'vendidos'}
                  </span>{' '}
                  · <span className="num pos">{formatGoldCompact(soldGold)}</span> em vendas
                </>
              )}
            </span>
          </div>
          <div className="flex">
            <button
              type="button"
              className={cn('tab', tab === 'pending' && 'tab-active')}
              onClick={() => setTab('pending')}
            >
              Pendentes <span className="num text-xs text-muted-foreground">({pendingCount})</span>
            </button>
            <button
              type="button"
              className={cn('tab', tab === 'sold' && 'tab-active')}
              onClick={() => setTab('sold')}
            >
              Vendidos <span className="num text-xs text-muted-foreground">({soldCount})</span>
            </button>
          </div>
        </div>

        <div className={cn('sheet-head', cols)}>
          <div>Item</div>
          <div className="text-right">Qtd</div>
          <div>Drop</div>
          <div>Atividade</div>
          {tab === 'pending' ? (
            <div className="text-right">Parado há</div>
          ) : (
            <>
              <div>Venda</div>
              <div className="text-right">Total</div>
            </>
          )}
          <div />
        </div>

        {rows.length === 0 ? (
          <div className="sheet-empty">
            {tab === 'pending' ? 'Nada pendente.' : 'Nada vendido ainda.'}
          </div>
        ) : (
          rows.map(({ item, session, activity }) => {
            const dropDate = session?.started_at ?? item.created_at;
            const d = daysSince(dropDate);
            return (
              <div key={item.id} className={cn('sheet-row', cols)}>
                <Link
                  to={ledgerHref(dropDate, item.id)}
                  className="group flex items-center gap-2.5 min-w-0"
                  title={`Abrir o lançamento de ${fmtDate(dropDate)} (onde o item foi registrado)`}
                >
                  <ItemIcon name={item.item_name} />
                  <span className="font-medium truncate group-hover:underline underline-offset-2">
                    {item.item_name}
                  </span>
                </Link>
                <div className="num">{item.quantity}</div>
                <Link
                  to={ledgerHref(dropDate, item.id)}
                  className="num text-left text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                  title="Ver tudo o que foi lançado nesse dia"
                >
                  {fmtDate(dropDate)}
                </Link>
                <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
                  {activity && <ColorMark color={activity.color} />}
                  <span className="truncate">{activity?.name ?? '—'}</span>
                </div>
                {tab === 'pending' ? (
                  <div className="text-right">{daysBadge(d)}</div>
                ) : (
                  <>
                    <Link
                      to={ledgerHref(item.sold_at!, item.id)}
                      className="num text-left text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                      title="Ver o dia da venda"
                    >
                      {fmtDate(item.sold_at!)}
                    </Link>
                    <div className="num pos">
                      {formatGoldLong(item.quantity * (item.sold_price ?? 0))}{' '}
                      <span className="text-muted-foreground text-xs">
                        {item.sold_currency === 'tc' ? 'TC' : 'gp'}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-end">
                  {tab === 'pending' ? (
                    <Button size="sm" onClick={() => setSelling(item)} aria-label="Vender item">
                      Vender
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Apagar "${item.item_name}" permanentemente?`)) del.mutate(item.id);
                      }}
                      className="link-danger"
                    >
                      apagar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <SellItemModal
        open={selling != null}
        item={selling}
        activityName={
          activities.find(
            (a) => a.id === sessions.find((s) => s.id === selling?.session_id)?.activity_id,
          )?.name
        }
        onClose={() => setSelling(null)}
      />
    </div>
  );
}
