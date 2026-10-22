import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { parseGold } from '@/lib/goldFormat';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { useCharacters } from '@/hooks/useCharacters';
import { localDateKey } from '@/lib/currency';
import type { Currency, Expense, ExpenseCategory } from '@/types/database';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edição: despesa existente. */
  editing?: Expense | null;
  /** Dia (YYYY-MM-DD) pré-selecionado no cadastro — o dia aberto na Home. */
  defaultDay?: string;
}

export function ExpenseModal({ open, onClose, editing, defaultDay }: Props) {
  const { data: characters = [] } = useCharacters();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const pending = create.isPending || update.isPending;

  const [category, setCategory] = React.useState<ExpenseCategory>('boost');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState<Currency>('tc');
  const [characterId, setCharacterId] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState(localDateKey());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (characters.length > 0 && !characterId) setCharacterId(characters[0].id);
  }, [characters, characterId]);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setCategory(editing.category);
      setDescription(editing.description ?? '');
      setAmount(String(editing.amount));
      setCurrency(editing.currency);
      setCharacterId(editing.character_id);
      setOccurredAt(editing.occurred_at);
    } else {
      setDescription('');
      setAmount('');
      setOccurredAt(defaultDay ?? localDateKey());
    }
  }, [open, editing?.id]);

  async function submit() {
    setError(null);
    if (pending) return;
    if (!characterId) return setError('Cadastre um personagem antes.');
    if (!occurredAt) return setError('Informe a data.');
    const parsed =
      currency === 'gold' ? parseGold(amount) : Number(amount.trim().replace(',', '.'));
    // amount > 0 é CHECK no banco; arredondar 0.4 daria 0
    if (parsed == null || !Number.isFinite(parsed) || Math.round(parsed) <= 0)
      return setError('Valor inválido.');
    try {
      const row = {
        character_id: characterId,
        occurred_at: occurredAt,
        category,
        amount: Math.round(parsed),
        currency,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...row, description: description.trim() || null });
      } else {
        await create.mutateAsync({ ...row, description: description.trim() || undefined });
      }
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      subtitle={editing ? 'Editar lançamento' : 'Novo lançamento de despesa'}
      title={editing ? 'Despesa' : 'Nova despesa'}
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={pending}>
            {editing ? 'Salvar alterações' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Categoria</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              <option value="boost">Boost</option>
              <option value="prey">Prey</option>
              <option value="purchase">Compra</option>
              <option value="other">Outro</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Data</label>
            <Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
          <Input
            placeholder="ex: XP Boost 1h"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Valor</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Moeda</label>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="tc">tc</option>
              <option value="gold">gold</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Personagem</label>
          <Select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {error && <div className="text-xs neg">{error}</div>}
      </div>
    </Modal>
  );
}
