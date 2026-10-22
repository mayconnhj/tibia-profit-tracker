// Catálogo de itens com imagem (GIF hospedado no TibiaWiki BR), no mesmo padrão
// dos projetos rotten-blood-tracker e soulwar-tracker.
// URL MediaWiki: /images/X/XY/<Arquivo>.gif, onde XY são os 2 primeiros hex do
// md5("<Nome_com_underscores>.gif").
//
// Soul War e Rotten Blood: URLs copiadas dos outros dois projetos.
// Make Believe: loot conforme TibiaWiki (Fandom) em 09/2026; URLs geradas pela
// mesma fórmula e conferidas (HTTP 200).

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
      { name: 'Moonsilver Claymore', url: 'https://www.tibiawiki.com.br/images/f/f0/Moonsilver_Claymore.gif' },
      { name: 'Moonsilver Epee', url: 'https://www.tibiawiki.com.br/images/0/0f/Moonsilver_Epee.gif' },
      { name: 'Moonsilver Axe', url: 'https://www.tibiawiki.com.br/images/5/5a/Moonsilver_Axe.gif' },
      { name: 'Moonsilver Chopper', url: 'https://www.tibiawiki.com.br/images/6/6d/Moonsilver_Chopper.gif' },
      { name: 'Moonsilver Mace', url: 'https://www.tibiawiki.com.br/images/6/65/Moonsilver_Mace.gif' },
      { name: 'Moonsilver Crusher', url: 'https://www.tibiawiki.com.br/images/f/ff/Moonsilver_Crusher.gif' },
      { name: 'Moonsilver Bow', url: 'https://www.tibiawiki.com.br/images/c/cf/Moonsilver_Bow.gif' },
      { name: 'Moonsilver Crossbow', url: 'https://www.tibiawiki.com.br/images/7/70/Moonsilver_Crossbow.gif' },
      { name: 'Moonsilver Sceptre', url: 'https://www.tibiawiki.com.br/images/3/39/Moonsilver_Sceptre.gif' },
      { name: 'Moonsilver Channeler', url: 'https://www.tibiawiki.com.br/images/a/a5/Moonsilver_Channeler.gif' },
      { name: 'Moonsilver Katar', url: 'https://www.tibiawiki.com.br/images/0/06/Moonsilver_Katar.gif' },
      { name: 'Auric Moon Sigil', url: 'https://www.tibiawiki.com.br/images/2/2d/Auric_Moon_Sigil.gif' },
      { name: 'Figurine of Phosphorus', url: 'https://www.tibiawiki.com.br/images/1/14/Figurine_of_Phosphorus.gif' },
    ],
  },
  {
    id: 'make-believe-minibosses',
    label: 'Make Believe · Mini bosses (capacetes)',
    keywords: ['make believe', 'make belive', 'mimar', 'haffar', 'maior', 'domus', 'dommus', 'mini boss'],
    items: [
      { name: 'Moonsilver Battle Visor', url: 'https://www.tibiawiki.com.br/images/c/cb/Moonsilver_Battle_Visor.gif', note: 'Mimar Haffar' },
      { name: 'Moonsilver Spirit Mask', url: 'https://www.tibiawiki.com.br/images/8/8a/Moonsilver_Spirit_Mask.gif', note: 'Mimar Haffar' },
      { name: 'Moonsilver Strike Helm', url: 'https://www.tibiawiki.com.br/images/b/bf/Moonsilver_Strike_Helm.gif', note: 'Maior Domus' },
      { name: 'Moonsilver Trail Hood', url: 'https://www.tibiawiki.com.br/images/c/c7/Moonsilver_Trail_Hood.gif', note: 'Maior Domus' },
      { name: 'Moonsilver Nimbus Hat', url: 'https://www.tibiawiki.com.br/images/1/1b/Moonsilver_Nimbus_Hat.gif', note: 'mini boss' },
      { name: 'Figurine of Mimar Haffar', url: 'https://www.tibiawiki.com.br/images/1/14/Figurine_of_Mimar_Haffar.gif', note: 'Mimar Haffar' },
      { name: 'Figurine of Maior Domus', url: 'https://www.tibiawiki.com.br/images/0/0c/Figurine_of_Maior_Domus.gif', note: 'Maior Domus' },
    ],
  },
  {
    id: 'soul-war',
    label: 'Soul War',
    keywords: ['soul war', 'soulwar', 'goshnar'],
    items: [
      { name: 'Soulcutter', url: 'https://www.tibiawiki.com.br/images/8/80/Soulcutter.gif' },
      { name: 'Soulshredder', url: 'https://www.tibiawiki.com.br/images/2/23/Soulshredder.gif' },
      { name: 'Soulbiter', url: 'https://www.tibiawiki.com.br/images/4/42/Soulbiter.gif' },
      { name: 'Souleater (Axe)', url: 'https://www.tibiawiki.com.br/images/4/4a/Souleater_%28Axe%29.gif' },
      { name: 'Soulcrusher', url: 'https://www.tibiawiki.com.br/images/9/93/Soulcrusher.gif' },
      { name: 'Soulmaimer', url: 'https://www.tibiawiki.com.br/images/9/9f/Soulmaimer.gif' },
      { name: 'Soulbleeder', url: 'https://www.tibiawiki.com.br/images/d/d3/Soulbleeder.gif' },
      { name: 'Soulpiercer', url: 'https://www.tibiawiki.com.br/images/8/88/Soulpiercer.gif' },
      { name: 'Soultainter', url: 'https://www.tibiawiki.com.br/images/6/6d/Soultainter.gif' },
      { name: 'Soulhexer', url: 'https://www.tibiawiki.com.br/images/4/45/Soulhexer.gif' },
      { name: 'Soulkamas', url: 'https://www.tibiawiki.com.br/images/9/9a/Soulkamas.gif' },
      { name: 'Soulshanks', url: 'https://www.tibiawiki.com.br/images/d/d2/Soulshanks.gif' },
      { name: 'Soulstrider', url: 'https://www.tibiawiki.com.br/images/2/27/Soulstrider.gif' },
      { name: 'Soulshell', url: 'https://www.tibiawiki.com.br/images/f/fd/Soulshell.gif' },
      { name: 'Soulmantle', url: 'https://www.tibiawiki.com.br/images/c/cb/Soulmantle.gif' },
      { name: 'Soulshroud', url: 'https://www.tibiawiki.com.br/images/f/f0/Soulshroud.gif' },
      { name: 'Soulgarb', url: 'https://www.tibiawiki.com.br/images/2/23/Soulgarb.gif' },
      { name: 'Soulbastion', url: 'https://www.tibiawiki.com.br/images/b/bd/Soulbastion.gif' },
      { name: 'Pair of Soulwalkers', url: 'https://www.tibiawiki.com.br/images/3/33/Pair_of_Soulwalkers.gif' },
      { name: 'Pair of Soulstalkers', url: 'https://www.tibiawiki.com.br/images/c/cb/Pair_of_Soulstalkers.gif' },
      { name: 'Soulsoles', url: 'https://www.tibiawiki.com.br/images/a/ae/Soulsoles.gif' },
    ],
  },
  {
    id: 'rotten-blood',
    label: 'Rotten Blood',
    keywords: ['rotten', 'blood', 'bakragore'],
    items: [
      { name: 'Sanguine Bludgeon', url: 'https://www.tibiawiki.com.br/images/e/e1/Sanguine_Bludgeon.gif' },
      { name: 'Sanguine Cudgel', url: 'https://www.tibiawiki.com.br/images/c/c4/Sanguine_Cudgel.gif' },
      { name: 'Sanguine Blade', url: 'https://www.tibiawiki.com.br/images/7/79/Sanguine_Blade.gif' },
      { name: 'Sanguine Razor', url: 'https://www.tibiawiki.com.br/images/f/fb/Sanguine_Razor.gif' },
      { name: 'Sanguine Hatchet', url: 'https://www.tibiawiki.com.br/images/3/3b/Sanguine_Hatchet.gif' },
      { name: 'Sanguine Battleaxe', url: 'https://www.tibiawiki.com.br/images/6/6f/Sanguine_Battleaxe.gif' },
      { name: 'Sanguine Bow', url: 'https://www.tibiawiki.com.br/images/f/fd/Sanguine_Bow.gif' },
      { name: 'Sanguine Crossbow', url: 'https://www.tibiawiki.com.br/images/b/b5/Sanguine_Crossbow.gif' },
      { name: 'Sanguine Rod', url: 'https://www.tibiawiki.com.br/images/a/ac/Sanguine_Rod.gif' },
      { name: 'Sanguine Coil', url: 'https://www.tibiawiki.com.br/images/7/7a/Sanguine_Coil.gif' },
      { name: 'Sanguine Claws', url: 'https://www.tibiawiki.com.br/images/2/21/Sanguine_Claws.gif' },
      { name: 'Sanguine Legs', url: 'https://www.tibiawiki.com.br/images/4/43/Sanguine_Legs.gif' },
      { name: 'Sanguine Trousers', url: 'https://www.tibiawiki.com.br/images/6/6a/Sanguine_Trousers.gif' },
      { name: 'Sanguine Greaves', url: 'https://www.tibiawiki.com.br/images/0/01/Sanguine_Greaves.gif' },
      { name: 'Sanguine Galoshes', url: 'https://www.tibiawiki.com.br/images/5/55/Sanguine_Galoshes.gif' },
      { name: 'Sanguine Boots', url: 'https://www.tibiawiki.com.br/images/9/92/Sanguine_Boots.gif' },
      { name: 'Abridged Promotion Scroll', url: 'https://www.tibiawiki.com.br/images/4/4b/Abridged_Promotion_Scroll.gif' },
      { name: 'Basic Promotion Scroll', url: 'https://www.tibiawiki.com.br/images/7/7d/Basic_Promotion_Scroll.gif' },
      { name: 'Revised Promotion Scroll', url: 'https://www.tibiawiki.com.br/images/a/a9/Revised_Promotion_Scroll.gif' },
      { name: 'Extended Promotion Scroll', url: 'https://www.tibiawiki.com.br/images/f/f3/Extended_Promotion_Scroll.gif' },
      { name: 'Advanced Promotion Scroll', url: 'https://www.tibiawiki.com.br/images/5/53/Advanced_Promotion_Scroll.gif' },
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
      { name: 'Grand Sanguine Bludgeon', url: 'https://www.tibiawiki.com.br/images/8/82/Grand_Sanguine_Bludgeon.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Cudgel', url: 'https://www.tibiawiki.com.br/images/9/93/Grand_Sanguine_Cudgel.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Blade', url: 'https://www.tibiawiki.com.br/images/b/b7/Grand_Sanguine_Blade.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Razor', url: 'https://www.tibiawiki.com.br/images/b/b5/Grand_Sanguine_Razor.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Hatchet', url: 'https://www.tibiawiki.com.br/images/a/a0/Grand_Sanguine_Hatchet.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Battleaxe', url: 'https://www.tibiawiki.com.br/images/a/af/Grand_Sanguine_Battleaxe.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Bow', url: 'https://www.tibiawiki.com.br/images/3/3a/Grand_Sanguine_Bow.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Crossbow', url: 'https://www.tibiawiki.com.br/images/3/38/Grand_Sanguine_Crossbow.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Rod', url: 'https://www.tibiawiki.com.br/images/c/c9/Grand_Sanguine_Rod.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Coil', url: 'https://www.tibiawiki.com.br/images/0/08/Grand_Sanguine_Coil.gif', note: 'Bakragore' },
      { name: 'Grand Sanguine Claws', url: 'https://www.tibiawiki.com.br/images/3/38/Grand_Sanguine_Claws.gif', note: 'Bakragore' },
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
