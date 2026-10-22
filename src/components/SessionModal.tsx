import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ItemPicker } from '@/components/ItemPicker';
import { HuntImport, type HuntImportValues } from '@/components/HuntImport';
import { looksLikeHuntAnalyser } from '@/lib/partyHunt';
import { parseGold, formatGoldLong } from '@/lib/goldFormat';
import { localDateKey } from '@/lib/currency';
import { findCatalogItem } from '@/lib/items';
import { useCreateSession, useUpdateSession } from '@/hooks/useSessions';
import { useCharacters } from '@/hooks/useCharacters';
import { useAllActivities } from '@/hooks/useActivities';
import type { Activity, Currency, Session, SessionItem } from '@/types/database';

interface ItemDraft {
  key: string;
  /** id do item no banco quando está editando um item que já existia */
  id?: string;
  item_name: string;
  quantity: string;
  price: string;
  currency: Currency;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Cadastro: atividade escolhida na grid. */
  activity?: Activity | null;
  /** Edição: sessão existente com seus itens. */
  editing?: { session: Session; items: SessionItem[] } | null;
  /** Dia (YYYY-MM-DD) pré-selecionado no cadastro — o dia que está aberto na Home. */
  defaultDay?: string;
}

/** Date → valor de <input type="datetime-local"> no fuso local. */
function toLocalInput(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${localDateKey(d)}T${hh}:${mm}`;
}

let draftSeq = 0;
const newKey = () => `draft-${++draftSeq}`;

export function SessionModal({ open, onClose, activity, editing, defaultDay }: Props) {
  const { data: characters = [] } = useCharacters();
  const { data: allActivities = [] } = useAllActivities();
  const create = useCreateSession();
  const update = useUpdateSession();
  const isEdit = editing != null;
  const pending = create.isPending || update.isPending;

  const [activityId, setActivityId] = React.useState('');
  const [startedAt, setStartedAt] = React.useState('');
  const [durationMin, setDurationMin] = React.useState('60');
  const [characterId, setCharacterId] = React.useState('');
  const [profit, setProfit] = React.useState('');
  const [service, setService] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<ItemDraft[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  // importação do Party Hunt / Hunt Analyser (prévia com confirmação)
  const [importOpen, setImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState('');
  const [importedMsg, setImportedMsg] = React.useState<string | null>(null);

  // seleciona personagem inicial
  React.useEffect(() => {
    if (characters.length > 0 && !characterId) setCharacterId(characters[0].id);
  }, [characters, characterId]);

  // preenche ao abrir: vazio no cadastro, dados da sessão na edição
  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setImportOpen(false);
    setImportText('');
    setImportedMsg(null);
    if (editing) {
      const s = editing.session;
      setActivityId(s.activity_id);
      setStartedAt(toLocalInput(new Date(s.started_at)));
      setDurationMin(String(s.duration_min));
      setCharacterId(s.character_id);
      setProfit(s.profit_gold ? String(s.profit_gold) : '');
      setService(s.service_tc ? String(s.service_tc) : '');
      setNotes(s.notes ?? '');
      setItems(
        editing.items.map((i) => ({
          key: i.id,
          id: i.id,
          item_name: i.item_name,
          quantity: String(i.quantity),
          price: i.sold_price != null ? String(i.sold_price) : '',
          currency: i.sold_currency ?? 'gold',
        })),
      );
    } else {
      const now = new Date();
      // lançando num dia passado: usa aquele dia com a hora atual
      if (defaultDay && defaultDay !== localDateKey(now)) {
        const [y, m, d] = defaultDay.split('-').map(Number);
        now.setFullYear(y, m - 1, d);
      }
      setActivityId(activity?.id ?? '');
      setStartedAt(toLocalInput(now));
      setDurationMin('60');
      setProfit('');
      setService('');
      setNotes('');
      setItems([]);
    }
  }, [open, activity?.id, editing?.session.id]);

  const parsedProfit = React.useMemo(() => parseGold(profit) ?? 0, [profit]);
  const parsedService = React.useMemo(() => {
    const n = Number(service || 0);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }, [service]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: newKey(), item_name: '', quantity: '1', price: '', currency: 'gold' },
    ]);
  }

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  /** Aplica só o que foi marcado na prévia; o resto do formulário fica como está. */
  function applyImport(v: HuntImportValues) {
    const filled: string[] = [];
    if (v.profit != null) {
      setProfit(String(v.profit));
      filled.push('profit');
    }
    if (v.durationMin) {
      setDurationMin(String(v.durationMin));
      filled.push('tempo');
    }
    if (v.startedAt) {
      setStartedAt(toLocalInput(v.startedAt));
      filled.push('início');
    }
    if (v.characterId) {
      setCharacterId(v.characterId);
      filled.push('personagem');
    }
    if (v.items?.length) {
      const incoming = v.items;
      setItems((prev) => [
        ...prev,
        ...incoming
          .filter((i) => !prev.some((p) => findCatalogItem(p.item_name)?.name === i.name))
          .map((i) => ({
            key: newKey(),
            item_name: i.name,
            quantity: String(i.quantity),
            price: '',
            currency: 'gold' as Currency,
          })),
      ]);
      filled.push('itens');
    }
    if (v.note) {
      const note = v.note;
      setNotes((n) => (n.trim() ? n : note));
    }
    setImportOpen(false);
    setImportText('');
    setImportedMsg(
      filled.length > 0
        ? `Preenchido pelo split: ${filled.join(', ')}. Confira, ajuste o service e salve.`
        : null,
    );
  }

  /** Colar o texto do analyser em qualquer campo do modal abre a prévia em vez de colar no campo. */
  function onPaste(e: React.ClipboardEvent) {
    if ((e.target as HTMLElement).dataset.huntImport != null) return;
    const text = e.clipboardData.getData('text');
    if (!looksLikeHuntAnalyser(text)) return;
    e.preventDefault();
    setImportText(text);
    setImportOpen(true);
    setImportedMsg(null);
  }

  // isPending só muda no próximo render; a ref bloqueia Ctrl+Enter repetido no mesmo tick
  const submittingRef = React.useRef(false);

  async function submit() {
    if (submittingRef.current) return;
    setError(null);
    if (!activityId) return setError('Selecione a atividade.');
    if (!characterId) return setError('Cadastre um personagem antes.');
    const started = new Date(startedAt);
    if (!startedAt || Number.isNaN(started.getTime())) return setError('Data/hora inválida.');
    const dur = Math.round(Number(durationMin));
    if (!Number.isFinite(dur) || dur <= 0) return setError('Tempo em minutos inválido.');
    if (profit.trim() && parseGold(profit) == null)
      return setError('Profit inválido. Use ex: 3kk, 1,5kk, 750k, 3.000.000.');
    if (service.trim() && (!Number.isFinite(Number(service)) || Number(service) < 0))
      return setError('Service em TC inválido.');

    const itemRows = [];
    for (const i of items) {
      const typed = i.item_name.trim();
      if (!typed) continue;
      // grava o nome canônico do catálogo ("moonsilver bow" -> "Moonsilver Bow") pra imagem achar depois
      const name = findCatalogItem(typed)?.name ?? typed;
      const qty = Math.max(1, Math.round(Number(i.quantity)) || 1);
      let price: number | null = null;
      if (i.price.trim()) {
        const n =
          i.currency === 'gold' ? parseGold(i.price) : Number(i.price.trim().replace(',', '.'));
        if (n == null || !Number.isFinite(n) || n <= 0)
          return setError(`Preço inválido no item "${name}". Deixe em branco se ainda não vendeu.`);
        price = Math.round(n);
      }
      itemRows.push({
        id: i.id,
        item_name: name,
        quantity: qty,
        sold_price: price,
        sold_currency: price != null ? i.currency : null,
      });
    }

    const payload = {
      activity_id: activityId,
      character_id: characterId,
      started_at: started.toISOString(),
      duration_min: dur,
      profit_gold: parsedProfit,
      service_tc: parsedService,
      notes: notes.trim() || null,
    };

    submittingRef.current = true;
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.session.id, ...payload, items: itemRows });
      } else {
        await create.mutateAsync({
          ...payload,
          items: itemRows.map(({ id: _id, ...rest }) => rest),
        });
      }
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      submittingRef.current = false;
    }
  }

  // Ctrl+Enter em qualquer lugar do modal (inclusive com foco nos botões do rodapé)
  const submitRef = React.useRef(submit);
  submitRef.current = submit;
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!isEdit && !activity) return null;

  const title = isEdit
    ? (allActivities.find((a) => a.id === activityId)?.name ?? 'Sessão')
    : activity!.name;

  return (
    <Modal
      open={open}
      onClose={onClose}
      subtitle={isEdit ? 'Editar lançamento' : 'Novo lançamento de sessão'}
      title={title}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-muted-foreground">
            <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> salva
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" variant="primary" onClick={submit} disabled={pending}>
              {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4" onPaste={onPaste}>
        {importOpen ? (
          <HuntImport
            text={importText}
            onTextChange={setImportText}
            characters={characters}
            onApply={applyImport}
            onDiscard={() => {
              setImportOpen(false);
              setImportText('');
            }}
          />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-dashed border-input px-3 py-2">
            <span className={importedMsg ? 'text-xs pos' : 'text-xs text-muted-foreground'}>
              {importedMsg ??
                'Tem o split do Party Hunt ou do Hunt Analyser? Cole (Ctrl+V) em qualquer campo.'}
            </span>
            <Button size="sm" type="button" onClick={() => setImportOpen(true)}>
              Importar split
            </Button>
          </div>
        )}

        {isEdit && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Atividade</label>
            <Select value={activityId} onChange={(e) => setActivityId(e.target.value)}>
              {allActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.archived ? ' (arquivada)' : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-[1.3fr_0.7fr_1fr] gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Data e hora</label>
            <Input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tempo (min)</label>
            <Input
              autoFocus
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              Profit da quest <Badge variant="gold">gold</Badge>
            </label>
            <Input
              placeholder="ex: 3kk"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              className="font-mono"
            />
            <div className="text-[11px] text-muted-foreground mt-1 num text-left">
              = {formatGoldLong(parsedProfit)} gold
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              Service <Badge variant="tc">tc</Badge>
            </label>
            <Input
              placeholder="ex: 15"
              type="number"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="font-mono"
            />
            <div className="text-[11px] text-muted-foreground mt-1 num text-left">
              = {parsedService} TC
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground">Itens dropados</label>
            <Button size="sm" onClick={addItem} type="button">
              + Adicionar item
            </Button>
          </div>
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground px-3 py-2.5 border border-dashed border-input rounded-sm">
              Sem itens. Se dropou algo e ainda não vendeu, adicione sem preço — ele fica pendente
              no Estoque.
            </div>
          ) : (
            <div className="sheet">
              <div className="sheet-head grid-cols-[minmax(0,1fr)_52px_100px_68px_20px] gap-1.5 px-2">
                <div>Item</div>
                <div className="text-center">Qtd</div>
                <div className="text-right">Preço unit.</div>
                <div>Moeda</div>
                <div />
              </div>
              {items.map((it) => (
                <div
                  key={it.key}
                  className="grid grid-cols-[minmax(0,1fr)_52px_100px_68px_20px] gap-1.5 px-2 py-1.5 border-b border-border last:border-b-0"
                >
                  <ItemPicker
                    value={it.item_name}
                    onChange={(name) => updateItem(it.key, { item_name: name })}
                    activityName={title}
                  />
                  <Input
                    type="number"
                    value={it.quantity}
                    onChange={(e) => updateItem(it.key, { quantity: e.target.value })}
                    className="text-center font-mono"
                  />
                  <Input
                    placeholder="pendente"
                    value={it.price}
                    onChange={(e) => updateItem(it.key, { price: e.target.value })}
                    className="text-right font-mono"
                  />
                  <Select
                    value={it.currency}
                    onChange={(e) => updateItem(it.key, { currency: e.target.value as Currency })}
                  >
                    <option value="gold">gold</option>
                    <option value="tc">tc</option>
                  </Select>
                  <button
                    onClick={() => removeItem(it.key)}
                    type="button"
                    className="text-muted-foreground hover:text-negative"
                    aria-label="Remover item"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="text-[11px] text-muted-foreground px-2 py-1.5 bg-muted border-t border-border">
                Preço em branco = item pendente (vai para o Estoque).
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Notas</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </div>

        {error && <div className="text-xs neg">{error}</div>}
      </div>
    </Modal>
  );
}
