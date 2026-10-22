import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ItemIcon } from '@/components/ItemIcon';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { parseGold, formatGoldLong } from '@/lib/goldFormat';
import { localDateKey } from '@/lib/currency';
import { useSellItem } from '@/hooks/useSessions';
import type { Currency, SessionItem } from '@/types/database';

interface Props {
  open: boolean;
  onClose: () => void;
  item: SessionItem | null;
  activityName?: string;
}

export function SellItemModal({ open, onClose, item, activityName }: Props) {
  const sell = useSellItem();
  const [price, setPrice] = React.useState('');
  const [currency, setCurrency] = React.useState<Currency>('gold');
  const [soldAt, setSoldAt] = React.useState(localDateKey());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setPrice('');
      setCurrency('gold');
      setSoldAt(localDateKey());
      setError(null);
    }
  }, [open, item?.id]);

  const parsed = React.useMemo(() => {
    if (!price.trim()) return 0;
    const n = currency === 'gold' ? parseGold(price) : Number(price.trim().replace(',', '.'));
    return n != null && Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }, [price, currency]);

  async function submit() {
    setError(null);
    if (!item || sell.isPending) return;
    if (!parsed || parsed <= 0) return setError('Preço inválido.');
    if (!soldAt) return setError('Informe a data da venda.');
    try {
      await sell.mutateAsync({
        id: item.id,
        sold_price: parsed,
        sold_currency: currency,
        sold_at: new Date(soldAt + 'T12:00:00').toISOString(),
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!item) return null;
  const qty = item.quantity;
  const total = parsed * qty;

  return (
    <Modal
      open={open}
      onClose={onClose}
      subtitle="Registrar venda"
      title={
        <span className="flex items-center gap-2.5">
          <ItemIcon name={item.item_name} />
          <span>
            {item.item_name} <span className="text-muted-foreground font-normal">× {qty}</span>
          </span>
        </span>
      }
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={sell.isPending}>
            Confirmar venda
          </Button>
        </div>
      }
    >
      {activityName && (
        <div className="text-[11px] text-muted-foreground -mt-2 mb-3">
          dropou em {activityName}
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Preço unitário</label>
            <Input autoFocus value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Moeda</label>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="gold">gold</option>
              <option value="tc">tc</option>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Data da venda</label>
          <Input type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        </div>
        <div className="flex justify-between items-center rounded-sm border border-border bg-muted px-3 py-2">
          <span className="text-xs text-muted-foreground">Total da venda</span>
          <span className="num text-base font-medium">
            {formatGoldLong(total)} {currency === 'gold' ? 'gold' : 'TC'}
          </span>
        </div>
        {error && <div className="text-xs neg">{error}</div>}
      </div>
    </Modal>
  );
}
