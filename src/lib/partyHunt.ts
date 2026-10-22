// Leitura do texto copiado do Party Hunt Analyser (e do Hunt Analyser solo) do Tibia.
//
// Party Hunt:                              Hunt Analyser (solo):
//   Session data: From 2026-09-23, 07:04:35 to ...   Session data: From ... to ...
//   Session: 03:38h                                  Session: 01:12h
//   Loot Type: Leader                                Raw XP Gain: ...
//   Loot: 47,580,422                                 Loot: 1,234,567
//   Supplies: 14,385,394                             Supplies: 234,567
//   Balance: 33,195,028                              Balance: 1,000,000
//   Abel Shaene                                      ...
//   	Loot: 2,287,840                               Looted Items:
//   	Balance: 522,795                                1x a soulcutter
//   Lark Zepiin (Leader)
//   	...
//
// O valor de sessão do app é sempre a parte de UMA pessoa: aqui só calculamos a
// sugestão (Balance ÷ jogadores); quem decide aplicar é o usuário.

export interface PartyMember {
  name: string;
  leader: boolean;
  loot: number;
  supplies: number;
  balance: number;
}

export interface ParsedHunt {
  kind: 'party' | 'solo';
  /** início da sessão (hora local do cliente do Tibia) */
  startedAt: Date | null;
  durationMin: number | null;
  loot: number | null;
  supplies: number | null;
  balance: number;
  members: PartyMember[];
  /** itens do "Looted Items" (só Hunt Analyser solo) */
  lootedItems: { name: string; quantity: number }[];
}

/** "47,580,422" / "-1,765,045" / "47.580.422" -> número */
function toInt(s: string): number {
  const n = Number(s.trim().replace(/[.,\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function field(block: string, label: string): number | null {
  const m = new RegExp(`^\\s*${label}:\\s*(-?[\\d.,]+)\\s*$`, 'im').exec(block);
  return m ? toInt(m[1]) : null;
}

/** true se o texto parece um export do analyser (pra reconhecer o colar automático). */
export function looksLikeHuntAnalyser(text: string): boolean {
  return /Session data:\s*From/i.test(text) && /Balance:/i.test(text);
}

export function parseHuntAnalyser(text: string): ParsedHunt | null {
  if (!looksLikeHuntAnalyser(text)) return null;
  const lines = text.replace(/\r/g, '').split('\n');

  const from = /From\s+(\d{4})-(\d{2})-(\d{2}),\s*(\d{2}):(\d{2}):(\d{2})/i.exec(text);
  const startedAt = from
    ? new Date(+from[1], +from[2] - 1, +from[3], +from[4], +from[5], +from[6])
    : null;

  const dur = /^\s*Session:\s*(\d+):(\d{2})h/im.exec(text);
  const durationMin = dur ? Number(dur[1]) * 60 + Number(dur[2]) : null;

  // Cabeçalho vai até o primeiro "Balance:" (o total da party). Depois dele, jogador =
  // linha sem ":" seguida de "Loot:" — com ou sem indentação (colar às vezes perde os tabs).
  const firstBalance = lines.findIndex((l) => /^\s*Balance:/i.test(l));
  const headerEnd = firstBalance >= 0 ? firstBalance + 1 : lines.length;
  const members: PartyMember[] = [];
  for (let i = headerEnd; i < lines.length; i++) {
    const line = lines[i];
    const isMemberName =
      line.trim() !== '' && !line.includes(':') && /^\s*Loot:/i.test(lines[i + 1] ?? '');
    if (!isMemberName) continue;
    let j = i + 1;
    const block: string[] = [];
    while (j < lines.length && lines[j].includes(':')) {
      block.push(lines[j]);
      j++;
    }
    const b = block.join('\n');
    const rawName = line.trim();
    members.push({
      name: rawName.replace(/\s*\(Leader\)\s*$/i, ''),
      leader: /\(Leader\)\s*$/i.test(rawName),
      loot: field(b, 'Loot') ?? 0,
      supplies: field(b, 'Supplies') ?? 0,
      balance: field(b, 'Balance') ?? 0,
    });
    i = j - 1;
  }

  const header = lines.slice(0, headerEnd).join('\n');
  const loot = field(header, 'Loot');
  const supplies = field(header, 'Supplies');
  let balance = field(header, 'Balance');
  if (balance == null || Number.isNaN(balance)) {
    if (loot != null && supplies != null) balance = loot - supplies;
    else return null;
  }

  // "Looted Items:" do Hunt Analyser solo: "  1x a soulcutter"
  const lootedItems: { name: string; quantity: number }[] = [];
  const lootedStart = lines.findIndex((l) => /^\s*Looted Items:/i.test(l));
  if (lootedStart >= 0) {
    for (const l of lines.slice(lootedStart + 1)) {
      const m = /^\s*(\d+)x\s+(?:an?\s+)?(.+?)\s*$/i.exec(l);
      if (!m) {
        if (l.trim() === '' || /^\S/.test(l)) break;
        continue;
      }
      lootedItems.push({ quantity: Number(m[1]), name: m[2] });
    }
  }

  return {
    kind: members.length > 0 ? 'party' : 'solo',
    startedAt,
    durationMin,
    loot,
    supplies,
    balance,
    members,
    lootedItems,
  };
}

/** Parte de cada um: Balance ÷ jogadores (arredondado pro gold inteiro). */
export function splitShare(balance: number, players: number): number {
  if (!Number.isFinite(balance) || !players || players < 1) return 0;
  return Math.round(balance / players);
}
