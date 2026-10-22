import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ColorMark, ACTIVITY_TYPE_LABEL } from '@/components/ActivityGrid';
import {
  useCharacters,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
} from '@/hooks/useCharacters';
import {
  useAllActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/hooks/useActivities';
import { useSessions } from '@/hooks/useSessions';
import { useExpenses } from '@/hooks/useExpenses';
import { useMonthlyRates, useUpsertRate } from '@/hooks/useMonthlyRates';
import { parseGold, formatGoldLong } from '@/lib/goldFormat';
import { isRateLocked } from '@/lib/currency';
import { cn, capFirst } from '@/lib/cn';
import type { Activity, ActivityType, Character } from '@/types/database';

const COLORS = ['purple', 'teal', 'coral', 'blue', 'amber', 'green', 'pink', 'gray'];
const COLOR_LABEL: Record<string, string> = {
  purple: 'roxo',
  teal: 'verde-água',
  coral: 'coral',
  blue: 'azul',
  amber: 'âmbar',
  green: 'verde',
  pink: 'rosa',
  gray: 'cinza',
};
const TYPES: ActivityType[] = ['hunt', 'quest', 'boss', 'mini_boss', 'bazaar', 'other'];

export function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="page-title">Cadastros</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Taxa de câmbio mensal, personagens e atividades.
        </div>
      </div>

      <MonthlyRateSection />
      <CharactersSection />
      <ActivitiesSection />
    </div>
  );
}

function MonthlyRateSection() {
  const { data: rates = [] } = useMonthlyRates();
  const upsert = useUpsertRate();

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const current = rates.find((r) => r.year === y && r.month === m);
  const currentLocked = current ? isRateLocked(current, now) : false;

  const [tcGold, setTcGold] = React.useState(current ? String(current.tc_to_gold) : '');
  const [tcBrl, setTcBrl] = React.useState(current ? String(current.tc_to_brl) : '');
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  // preenche quando a taxa chega do servidor (no mount os dados ainda não carregaram)
  React.useEffect(() => {
    if (current) {
      setTcGold(String(current.tc_to_gold));
      setTcBrl(String(current.tc_to_brl));
    }
  }, [current?.id, current?.updated_at]);

  async function save() {
    setMsg(null);
    const g = parseGold(tcGold);
    const b = Number(tcBrl.trim().replace(',', '.'));
    if (!g || g <= 0) return setMsg({ ok: false, text: 'Valor em gold inválido (ex: 40k).' });
    if (!tcBrl.trim() || !Number.isFinite(b) || b <= 0)
      return setMsg({ ok: false, text: 'Valor em BRL inválido (ex: 0,85).' });
    try {
      await upsert.mutateAsync({ year: y, month: m, tc_to_gold: g, tc_to_brl: b });
      setMsg({ ok: true, text: 'Taxa salva.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  const monthLabel = capFirst(
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now),
  );

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
      <div className="sheet">
        <div className="sheet-title">
          <div>
            <div className="title">Taxa de câmbio do mês</div>
            <div className="text-xs text-muted-foreground">{monthLabel}</div>
          </div>
          <Badge variant={currentLocked ? 'neutral' : 'success'}>
            {currentLocked ? 'travado' : 'editável'}
          </Badge>
        </div>
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                1 TC em <Badge variant="gold">gold</Badge>
              </label>
              <Input
                value={tcGold}
                onChange={(e) => setTcGold(e.target.value)}
                placeholder="ex: 40k"
                className="font-mono"
              />
              <div className="text-[11px] text-muted-foreground mt-1 num text-left">
                = {formatGoldLong(parseGold(tcGold) ?? 0)} gold
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                1 TC em <Badge variant="brl">brl</Badge>
              </label>
              <Input
                value={tcBrl}
                onChange={(e) => setTcBrl(e.target.value)}
                placeholder="ex: 0,85"
                className="font-mono"
              />
              <div className="text-[11px] text-muted-foreground mt-1 num text-left">
                = {formatBRLValue(Number(tcBrl.replace(',', '.')))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            {msg && <span className={cn('text-xs', msg.ok ? 'pos' : 'neg')}>{msg.text}</span>}
            <Button size="sm" variant="primary" onClick={save} disabled={upsert.isPending || currentLocked}>
              {upsert.isPending ? 'Salvando…' : 'Salvar taxa'}
            </Button>
          </div>
        </div>
      </div>

      <div className="sheet">
        <div className="sheet-title">
          <div className="title">Histórico de taxas</div>
          <span className="text-[11px] text-muted-foreground">trava 7 dias após o fim do mês</span>
        </div>
        <div className="sheet-head grid-cols-[1fr_1fr_1fr_80px]">
          <div>Mês</div>
          <div className="text-right">TC → Gold</div>
          <div className="text-right">TC → BRL</div>
          <div className="text-right">Status</div>
        </div>
        {rates.length === 0 ? (
          <div className="sheet-empty">Nenhuma taxa cadastrada.</div>
        ) : (
          rates.map((r) => (
            <div key={r.id} className="sheet-row grid-cols-[1fr_1fr_1fr_80px]">
              <div className="num text-left">
                {String(r.month).padStart(2, '0')}/{r.year}
              </div>
              <div className="num">{formatGoldLong(r.tc_to_gold)}</div>
              <div className="num">{formatBRLValue(Number(r.tc_to_brl))}</div>
              <div className="text-right">
                <Badge variant={isRateLocked(r, now) ? 'neutral' : 'success'}>
                  {isRateLocked(r, now) ? 'travado' : 'aberto'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/** BRL com até 4 casas (tc_to_brl é numeric(10,4)); toFixed(2) escondia 0,8475 como 0,85. */
function formatBRLValue(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 4,
  }).format(Number.isFinite(v) ? v : 0);
}

// ---------------------------------------------------------------------------
// Personagens
// ---------------------------------------------------------------------------

function CharactersSection() {
  const { data: characters = [] } = useCharacters();
  const { data: sessions = [] } = useSessions();
  const { data: expenses = [] } = useExpenses();
  const create = useCreateCharacter();
  const update = useUpdateCharacter();
  const del = useDeleteCharacter();

  const [name, setName] = React.useState('');
  const [vocation, setVocation] = React.useState('');
  const [world, setWorld] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  async function add() {
    setError(null);
    if (!name.trim()) return setError('Informe o nome.');
    try {
      await create.mutateAsync({
        name: name.trim(),
        vocation: vocation.trim() || undefined,
        world: world.trim() || undefined,
      });
      setName('');
      setVocation('');
      setWorld('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function save(c: Character, patch: { name: string; vocation: string; world: string }) {
    setError(null);
    if (!patch.name.trim()) return setError('O nome não pode ficar vazio.');
    try {
      await update.mutateAsync({
        id: c.id,
        name: patch.name.trim(),
        vocation: patch.vocation.trim() || null,
        world: patch.world.trim() || null,
      });
      setEditingId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(c: Character) {
    setError(null);
    const nSessions = sessions.filter((s) => s.character_id === c.id).length;
    const nExpenses = expenses.filter((e) => e.character_id === c.id).length;
    const linked =
      nSessions + nExpenses > 0
        ? `\n\nIsso também apaga ${nSessions} sessão(ões) e ${nExpenses} despesa(s) desse personagem ` +
          'e tira esses valores do relatório.'
        : '';
    if (!confirm(`Apagar o personagem "${c.name}"?${linked}\n\nNão dá pra desfazer.`)) return;
    try {
      await del.mutateAsync(c.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const cols = 'grid-cols-[1.2fr_1fr_1fr_70px_150px]';

  return (
    <section className="sheet">
      <div className="sheet-title">
        <div className="title">Personagens</div>
        <span className="text-[11px] text-muted-foreground">{characters.length} cadastrado(s)</span>
      </div>
      <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-2 p-3 border-b border-border bg-muted/50">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Vocação" value={vocation} onChange={(e) => setVocation(e.target.value)} />
        <Input placeholder="World" value={world} onChange={(e) => setWorld(e.target.value)} />
        <Button variant="primary" onClick={add} disabled={create.isPending}>
          + Adicionar
        </Button>
      </div>
      {error && <div className="px-3 py-2 text-xs neg border-b border-border">{error}</div>}
      <div className={cn('sheet-head', cols)}>
        <div>Nome</div>
        <div>Vocação</div>
        <div>World</div>
        <div className="text-right">Sessões</div>
        <div />
      </div>
      {characters.length === 0 ? (
        <div className="sheet-empty">Nenhum personagem cadastrado.</div>
      ) : (
        characters.map((c) =>
          editingId === c.id ? (
            <CharacterEditRow
              key={c.id}
              cols={cols}
              character={c}
              saving={update.isPending}
              onSave={(patch) => save(c, patch)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={c.id} className={cn('sheet-row', cols)}>
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-muted-foreground truncate">{c.vocation ?? '—'}</div>
              <div className="text-muted-foreground truncate">{c.world ?? '—'}</div>
              <div className="num text-muted-foreground">
                {sessions.filter((s) => s.character_id === c.id).length}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="link-action" onClick={() => setEditingId(c.id)}>
                  editar
                </button>
                <button
                  type="button"
                  className="link-danger"
                  onClick={() => remove(c)}
                  disabled={del.isPending}
                >
                  apagar
                </button>
              </div>
            </div>
          ),
        )
      )}
    </section>
  );
}

function CharacterEditRow({
  cols,
  character,
  saving,
  onSave,
  onCancel,
}: {
  cols: string;
  character: Character;
  saving: boolean;
  onSave: (patch: { name: string; vocation: string; world: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(character.name);
  const [vocation, setVocation] = React.useState(character.vocation ?? '');
  const [world, setWorld] = React.useState(character.world ?? '');
  const submit = () => onSave({ name, vocation, world });
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') onCancel();
  };
  return (
    <div className={cn('sheet-row bg-highlight', cols)} onKeyDown={onKeyDown}>
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
      <Input value={vocation} onChange={(e) => setVocation(e.target.value)} placeholder="Vocação" />
      <Input value={world} onChange={(e) => setWorld(e.target.value)} placeholder="World" />
      <div />
      <div className="flex justify-end gap-1.5">
        <Button size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" variant="primary" onClick={submit} disabled={saving}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atividades
// ---------------------------------------------------------------------------

function ActivitiesSection() {
  const { data: all = [] } = useAllActivities();
  const { data: sessions = [] } = useSessions();
  const create = useCreateActivity();
  const update = useUpdateActivity();
  const del = useDeleteActivity();

  const [tab, setTab] = React.useState<'active' | 'archived'>('active');
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<ActivityType>('quest');
  const [color, setColor] = React.useState('purple');
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const active = all.filter((a) => !a.archived);
  const archived = all.filter((a) => a.archived);
  const list = tab === 'active' ? active : archived;
  const sessionCount = (id: string) => sessions.filter((s) => s.activity_id === id).length;

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function add() {
    if (!name.trim()) return setError('Informe o nome.');
    await run(async () => {
      await create.mutateAsync({ name: name.trim(), type, color });
      setName('');
      setTab('active');
    });
  }

  function archive(a: Activity, archivedFlag: boolean) {
    if (
      archivedFlag &&
      !confirm(`Arquivar "${a.name}"? Ela sai da tela de lançamentos, mas o histórico e o relatório continuam.`)
    )
      return;
    run(() => update.mutateAsync({ id: a.id, archived: archivedFlag }));
  }

  function remove(a: Activity) {
    const n = sessionCount(a.id);
    const linked =
      n > 0
        ? `\n\nIsso também apaga ${n} sessão(ões) registrada(s) nela (com os itens dropados) ` +
          'e tira esses valores do relatório. Se quer só esconder, use "arquivar".'
        : '';
    if (!confirm(`Apagar a atividade "${a.name}"?${linked}\n\nNão dá pra desfazer.`)) return;
    run(() => del.mutateAsync(a.id));
  }

  const cols = 'grid-cols-[minmax(0,1.6fr)_110px_110px_70px_210px]';

  return (
    <section className="sheet">
      <div className="sheet-title pb-0 items-end">
        <div className="title pb-2">Atividades</div>
        <div className="flex">
          <button
            type="button"
            className={cn('tab', tab === 'active' && 'tab-active')}
            onClick={() => setTab('active')}
          >
            Ativas <span className="num text-xs text-muted-foreground">({active.length})</span>
          </button>
          <button
            type="button"
            className={cn('tab', tab === 'archived' && 'tab-active')}
            onClick={() => setTab('archived')}
          >
            Arquivadas <span className="num text-xs text-muted-foreground">({archived.length})</span>
          </button>
        </div>
      </div>

      {tab === 'active' && (
        <div className="grid grid-cols-[1fr_130px_130px_auto] gap-2 p-3 border-b border-border bg-muted/50">
          <Input
            placeholder="Nome (ex: Rotten Blood T1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <TypeSelect value={type} onChange={setType} />
          <ColorSelect value={color} onChange={setColor} />
          <Button variant="primary" onClick={add} disabled={create.isPending}>
            + Adicionar
          </Button>
        </div>
      )}
      {error && <div className="px-3 py-2 text-xs neg border-b border-border">{error}</div>}

      <div className={cn('sheet-head', cols)}>
        <div>Nome</div>
        <div>Tipo</div>
        <div>Cor</div>
        <div className="text-right">Sessões</div>
        <div />
      </div>
      {list.length === 0 ? (
        <div className="sheet-empty">
          {tab === 'active' ? 'Nenhuma atividade ativa.' : 'Nenhuma atividade arquivada.'}
        </div>
      ) : (
        list.map((a) =>
          editingId === a.id ? (
            <ActivityEditRow
              key={a.id}
              cols={cols}
              activity={a}
              saving={update.isPending}
              onSave={(patch) =>
                run(async () => {
                  if (!patch.name.trim()) throw new Error('O nome não pode ficar vazio.');
                  await update.mutateAsync({ id: a.id, ...patch, name: patch.name.trim() });
                  setEditingId(null);
                })
              }
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={a.id} className={cn('sheet-row', cols)}>
              <div className="flex items-center gap-2 min-w-0">
                <ColorMark color={a.color} />
                <span className="font-medium truncate">{a.name}</span>
              </div>
              <div className="text-muted-foreground">{ACTIVITY_TYPE_LABEL[a.type] ?? a.type}</div>
              <div className="text-muted-foreground">{COLOR_LABEL[a.color] ?? a.color}</div>
              <div className="num text-muted-foreground">{sessionCount(a.id)}</div>
              <div className="flex justify-end gap-3">
                <button type="button" className="link-action" onClick={() => setEditingId(a.id)}>
                  editar
                </button>
                {a.archived ? (
                  <button type="button" className="link-action" onClick={() => archive(a, false)}>
                    reativar
                  </button>
                ) : (
                  <button type="button" className="link-action" onClick={() => archive(a, true)}>
                    arquivar
                  </button>
                )}
                <button
                  type="button"
                  className="link-danger"
                  onClick={() => remove(a)}
                  disabled={del.isPending}
                >
                  apagar
                </button>
              </div>
            </div>
          ),
        )
      )}
    </section>
  );
}

function TypeSelect({ value, onChange }: { value: ActivityType; onChange: (v: ActivityType) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as ActivityType)}>
      {TYPES.map((t) => (
        <option key={t} value={t}>
          {ACTIVITY_TYPE_LABEL[t]}
        </option>
      ))}
    </Select>
  );
}

function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {COLORS.map((c) => (
        <option key={c} value={c}>
          {COLOR_LABEL[c]}
        </option>
      ))}
    </Select>
  );
}

function ActivityEditRow({
  cols,
  activity,
  saving,
  onSave,
  onCancel,
}: {
  cols: string;
  activity: Activity;
  saving: boolean;
  onSave: (patch: { name: string; type: ActivityType; color: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(activity.name);
  const [type, setType] = React.useState<ActivityType>(activity.type);
  const [color, setColor] = React.useState(activity.color);
  const submit = () => onSave({ name, type, color });
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') onCancel();
  };
  return (
    <div className={cn('sheet-row bg-highlight', cols)} onKeyDown={onKeyDown}>
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      <TypeSelect value={type} onChange={setType} />
      <ColorSelect value={color} onChange={setColor} />
      <div />
      <div className="flex justify-end gap-1.5">
        <Button size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" variant="primary" onClick={submit} disabled={saving}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
