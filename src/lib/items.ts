// Catálogo de itens com imagem. Os GIFs ficam no próprio site, em public/items/
// (servidos como /items/<Nome_com_underscores>.gif).
//
// Antes as imagens vinham direto do TibiaWiki BR, mas em 11/2026 ele passou a
// bloquear imagens embutidas em outros sites (Cloudflare + CORP same-origin) e
// todos os ícones sumiram. Os arquivos atuais foram baixados do TibiaWiki (Fandom).
// Item novo: salve o GIF em public/items/ com o nome do arquivo da wiki.

export interface CatalogItem {
  name: string;
  url: string;
  /** observação curta exibida no seletor (ex: de qual boss cai) */
  note?: string;
}

export interface CatalogGroup {
  id: string;
  label: string;
  /** se o nome da atividade contém uma dessas palavras, o grupo aparece primeiro */
  keywords: string[];
  items: CatalogItem[];
}

export const ITEM_GROUPS: CatalogGroup[] = [
  {
    id: 'make-believe-phosphorus',
    label: 'Make Believe · Phosphorus',
    keywords: ['make believe', 'make belive', 'phosphorus', 'phosporo', 'phosphoro'],
    items: [
      { name: 'Moonsilver Claymore', url: '/items/Moonsilver_Claymore.gif' },
      { name: 'Moonsilver Epee', url: '/items/Moonsilver_Epee.gif' },
      { name: 'Moonsilver Axe', url: '/items/Moonsilver_Axe.gif' },
      { name: 'Moonsilver Chopper', url: '/items/Moonsilver_Chopper.gif' },
      { name: 'Moonsilver Mace', url: '/items/Moonsilver_Mace.gif' },
      { name: 'Moonsilver Crusher', url: '/items/Moonsilver_Crusher.gif' },
      { name: 'Moonsilver Bow', url: '/items/Moonsilver_Bow.gif' },
      { name: 'Moonsilver Crossbow', url: '/items/Moonsilver_Crossbow.gif' },
      { name: 'Moonsilver Sceptre', url: '/items/Moonsilver_Sceptre.gif' },
      { name: 'Moonsilver Channeler', url: '/items/Moonsilver_Channeler.gif' },
      { name: 'Moonsilver Katar', url: '/items/Moonsilver_Katar.gif' },
      { name: 'Auric Moon Sigil', url: '/items/Auric_Moon_Sigil.gif' },
      { name: 'Figurine of Phosphorus', url: '/items/Figurine_of_Phosphorus.gif' },
    ],
  },
  {
    id: 'make-believe-minibosses',
    label: 'Make Believe · Mini bosses (capacetes)',
    keywords: ['make believe', 'make belive', 'mimar', 'haffar', 'maior', 'domus', 'dommus', 'mini boss'],
    items: [
      { name: 'Moonsilver Battle Visor', url: '/items/Moonsilver_Battle_Visor.gif', note: 'Mimar Haffar' },
      { name: 'Moonsilver Spirit Mask', url: '/items/Moonsilver_Spirit_Mask.gif', note: 'Mimar Haffar' },
      { name: 'Moonsilver Strike Helm', url: '/items/Moonsilver_Strike_Helm.gif', note: 'Maior Domus' },
      { name: 'Moonsilver Trail Hood', url: '/items/Moonsilver_Trail_Hood.gif', note: 'Maior Domus' },
      { name: 'Moonsilver Nimbus Hat', url: '/items/Moonsilver_Nimbus_Hat.gif', note: 'mini boss' },
      { name: 'Figurine of Mimar Haffar', url: '/items/Figurine_of_Mimar_Haffar.gif', note: 'Mimar Haffar' },
      { name: 'Figurine of Maior Domus', url: '/items/Figurine_of_Maior_Domus.gif', note: 'Maior Domus' },
    ],
  },
  {
    id: 'soul-war',
    label: 'Soul War',
    keywords: ['soul war', 'soulwar', 'goshnar'],
    items: [
      { name: 'Soulcutter', url: '/items/Soulcutter.gif' },
      { name: 'Soulshredder', url: '/items/Soulshredder.gif' },
      { name: 'Soulbiter', url: '/items/Soulbiter.gif' },
      { name: 'Souleater (Axe)', url: '/items/Souleater_%28Axe%29.gif' },
      { name: 'Soulcrusher', url: '/items/Soulcrusher.gif' },
      { name: 'Soulmaimer', url: '/items/Soulmaimer.gif' },
      { name: 'Soulbleeder', url: '/items/Soulbleeder.gif' },
      { name: 'Soulpiercer', url: '/items/Soulpiercer.gif' },
      { name: 'Soultainter', url: '/items/Soultainter.gif' },
      { name: 'Soulhexer', url: '/items/Soulhexer.gif' },
      { name: 'Soulkamas', url: '/items/Soulkamas.gif' },
      { name: 'Soulshanks', url: '/items/Soulshanks.gif' },
      { name: 'Soulstrider', url: '/items/Soulstrider.gif' },
      { name: 'Soulshell', url: '/items/Soulshell.gif' },
      { name: 'Soulmantle', url: '/items/Soulmantle.gif' },
      { name: 'Soulshroud', url: '/items/Soulshroud.gif' },
      { name: 'Soulgarb', url: '/items/Soulgarb.gif' },
      { name: 'Soulbastion', url: '/items/Soulbastion.gif' },
      { name: 'Pair of Soulwalkers', url: '/items/Pair_of_Soulwalkers.gif' },
      { name: 'Pair of Soulstalkers', url: '/items/Pair_of_Soulstalkers.gif' },
      { name: 'Soulsoles', url: '/items/Soulsoles.gif' },
    ],
  },
  {
    id: 'rotten-blood',
    label: 'Rotten Blood',
    keywords: ['rotten', 'blood', 'bakragore'],
    items: [
      { name: 'Sanguine Bludgeon', url: '/items/Sanguine_Bludgeon.gif' },
      { name: 'Sanguine Cudgel', url: '/items/Sanguine_Cudgel.gif' },
      { name: 'Sanguine Blade', url: '/items/Sanguine_Blade.gif' },
      { name: 'Sanguine Razor', url: '/items/Sanguine_Razor.gif' },
      { name: 'Sanguine Hatchet', url: '/items/Sanguine_Hatchet.gif' },
      { name: 'Sanguine Battleaxe', url: '/items/Sanguine_Battleaxe.gif' },
      { name: 'Sanguine Bow', url: '/items/Sanguine_Bow.gif' },
      { name: 'Sanguine Crossbow', url: '/items/Sanguine_Crossbow.gif' },
      { name: 'Sanguine Rod', url: '/items/Sanguine_Rod.gif' },
      { name: 'Sanguine Coil', url: '/items/Sanguine_Coil.gif' },
      { name: 'Sanguine Claws', url: '/items/Sanguine_Claws.gif' },
      { name: 'Sanguine Legs', url: '/items/Sanguine_Legs.gif' },
      { name: 'Sanguine Trousers', url: '/items/Sanguine_Trousers.gif' },
      { name: 'Sanguine Greaves', url: '/items/Sanguine_Greaves.gif' },
      { name: 'Sanguine Galoshes', url: '/items/Sanguine_Galoshes.gif' },
      { name: 'Sanguine Boots', url: '/items/Sanguine_Boots.gif' },
      { name: 'Abridged Promotion Scroll', url: '/items/Abridged_Promotion_Scroll.gif' },
      { name: 'Basic Promotion Scroll', url: '/items/Basic_Promotion_Scroll.gif' },
      { name: 'Revised Promotion Scroll', url: '/items/Revised_Promotion_Scroll.gif' },
      { name: 'Extended Promotion Scroll', url: '/items/Extended_Promotion_Scroll.gif' },
      { name: 'Advanced Promotion Scroll', url: '/items/Advanced_Promotion_Scroll.gif' },
    ],
  },
  {
    // Bag You Covet do Bakragore com Bakragore's Burden ativo (TibiaWiki, 10/2026).
    // Grand Sanguine Claws não aparece na lista da página da bag, mas a página do item
    // confirma a mesma origem.
    id: 'rotten-blood-grand',
    label: 'Rotten Blood · Grand Sanguine',
    keywords: ['rotten', 'blood', 'bakragore', 'grand'],
    items: [
      { name: 'Grand Sanguine Bludgeon', url: '/items/Grand_Sanguine_Bludgeon.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Cudgel', url: '/items/Grand_Sanguine_Cudgel.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Blade', url: '/items/Grand_Sanguine_Blade.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Razor', url: '/items/Grand_Sanguine_Razor.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Hatchet', url: '/items/Grand_Sanguine_Hatchet.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Battleaxe', url: '/items/Grand_Sanguine_Battleaxe.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Bow', url: '/items/Grand_Sanguine_Bow.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Crossbow', url: '/items/Grand_Sanguine_Crossbow.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Rod', url: '/items/Grand_Sanguine_Rod.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Coil', url: '/items/Grand_Sanguine_Coil.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Claws', url: '/items/Grand_Sanguine_Claws.gif', note: 'Bakragore' },
    ],
  },
];

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const BY_KEY = new Map<string, CatalogItem>();
for (const g of ITEM_GROUPS) for (const it of g.items) BY_KEY.set(normalize(it.name), it);

/** Distância de edição (Levenshtein) com corte: devolve max+1 se passar de max. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const lookupCache = new Map<string, CatalogItem | undefined>();

/**
 * Acha o item do catálogo pelo nome, ignorando maiúsculas, espaços e pontuação.
 * Pra exibir imagem de nomes digitados à mão, também aceita (só se houver UM candidato):
 *  - nome que é o fim de um item do catálogo: "Bludgeon" -> "Sanguine Bludgeon"
 *  - até 2 letras de diferença: "Moonsilver Chooper" -> "Moonsilver Chopper"
 */
export function findCatalogItem(name: string | null | undefined): CatalogItem | undefined {
  if (!name) return undefined;
  const key = normalize(name);
  if (!key) return undefined;
  if (lookupCache.has(key)) return lookupCache.get(key);

  let found = BY_KEY.get(key);
  if (!found && key.length >= 5) {
    const suffix = [...BY_KEY.entries()]
      .filter(([k]) => k.endsWith(key))
      .sort((a, b) => a[0].length - b[0].length);
    // "Bludgeon" casa com Sanguine Bludgeon e Grand Sanguine Bludgeon: fica com o nome
    // base quando os outros são só extensões dele ("grand" + base). Candidatos sem
    // relação ("Crusher": Soulcrusher × Moonsilver Crusher) continuam ambíguos.
    const [shortest, ...rest] = suffix;
    if (shortest && rest.every(([k]) => k.endsWith(shortest[0]))) found = shortest[1];
  }
  if (!found && key.length >= 8) {
    const close = [...BY_KEY.entries()].filter(([k]) => editDistance(key, k, 2) <= 2);
    if (close.length === 1) found = close[0][1];
  }
  lookupCache.set(key, found);
  return found;
}

/** Grupos ordenados: os que combinam com o nome da atividade vêm primeiro. */
export function groupsForActivity(activityName?: string): CatalogGroup[] {
  const n = (activityName ?? '').toLowerCase();
  const matches = (g: CatalogGroup) => g.keywords.some((k) => n.includes(k));
  return [...ITEM_GROUPS.filter(matches), ...ITEM_GROUPS.filter((g) => !matches(g))];
}
