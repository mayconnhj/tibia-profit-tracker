/**
 * Parser tolerante pra valores em gold digitados por humano.
 * Aceita:
 *   "3kk"       -> 3_000_000
 *   "3.5kk"     -> 3_500_000
 *   "750k"      -> 750_000
 *   "3000000"   -> 3_000_000
 *   "3.000.000" -> 3_000_000
 *   "1,5kk"     -> 1_500_000  (vírgula PT-BR aceita)
 *   "3.5"       -> 4          (decimal: 3.5 gold, arredondado)
 *
 * Regra do ponto (decisão documentada):
 *   - ponto E vírgula juntos: PT-BR, ponto = milhar, vírgula = decimal ("3.000,5" -> 3000.5)
 *   - só vírgula: decimal ("3,5" -> 3.5)
 *   - só ponto: é MILHAR apenas se todos os grupos depois de cada ponto têm
 *     exatamente 3 dígitos ("3.000.000", "750.000", "1.500k"); caso contrário
 *     é DECIMAL ("3.5", "3.50", "1.5kk"). Vale com ou sem sufixo.
 */
export function parseGold(input: string): number | null {
  if (input == null) return null;
  const raw = String(input).trim().toLowerCase().replace(/\s+/g, '');
  if (!raw) return null;

  // separa número + sufixo
  const match = raw.match(/^(-?[0-9.,]+)(kk|k)?$/);
  if (!match) return null;

  const [, numStr, suffix] = match;

  let normalized: string;
  if (numStr.includes('.') && numStr.includes(',')) {
    normalized = numStr.replace(/\./g, '').replace(',', '.');
  } else if (numStr.includes(',')) {
    normalized = numStr.replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(numStr)) {
    normalized = numStr.replace(/\./g, '');
  } else {
    normalized = numStr;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;

  if (suffix === 'kk') return Math.round(n * 1_000_000);
  if (suffix === 'k') return Math.round(n * 1_000);
  return Math.round(n);
}

/**
 * Formata um valor em gold pra exibição compacta.
 *   1_500_000 -> "1.5kk"
 *   750_000   -> "750k"
 *   500       -> "500"
 */
export function formatGoldCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.round(Math.abs(value));
  if (abs === 0) return '0';
  const sign = value < 0 ? '-' : '';
  // arredonda pra 1 casa ANTES de escolher a unidade, pra 999_950 virar "1kk" e não "1000.0k"
  const oneDecimal = (n: number) => Math.round(n * 10) / 10;
  if (oneDecimal(abs / 1_000) >= 1_000) {
    return `${sign}${oneDecimal(abs / 1_000_000)}kk`;
  }
  if (abs >= 1_000) {
    return `${sign}${oneDecimal(abs / 1_000)}k`;
  }
  return `${sign}${abs}`;
}

/** Formata "1234567" -> "1.234.567" (PT-BR) */
export function formatGoldLong(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Number.isFinite(value) ? Math.round(value) : 0);
}
