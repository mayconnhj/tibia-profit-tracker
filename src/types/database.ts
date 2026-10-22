// Tipos gerados manualmente a partir do schema.
// Se um dia rodar `supabase gen types typescript`, substitua por esses.

export type Currency = 'gold' | 'tc';
export type ActivityType = 'hunt' | 'quest' | 'boss' | 'mini_boss' | 'bazaar' | 'other';
export type ExpenseCategory = 'boost' | 'prey' | 'purchase' | 'other';

export interface Character {
  id: string;
  name: string;
  vocation: string | null;
  world: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  color: string;
  archived: boolean;
  /** ordem manual em "Registrar sessão" (migration 005); null = fim da lista */
  position?: number | null;
  created_at: string;
}

export interface Session {
  id: string;
  activity_id: string;
  character_id: string;
  started_at: string;
  duration_min: number;
  profit_gold: number;
  service_tc: number;
  notes: string | null;
  created_at: string;
}

export interface SessionItem {
  id: string;
  session_id: string;
  item_name: string;
  quantity: number;
  sold_price: number | null;
  sold_currency: Currency | null;
  sold_at: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  character_id: string;
  occurred_at: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  currency: Currency;
  created_at: string;
}

export interface MonthlyRate {
  id: string;
  year: number;
  month: number;
  tc_to_gold: number;
  tc_to_brl: number;
  locked: boolean;
  locked_at: string | null;
  updated_at: string;
}

// Junções úteis pras telas
export interface SessionWithRefs extends Session {
  activity: Activity;
  character: Character;
  items: SessionItem[];
}

export interface PendingItem extends SessionItem {
  session: Pick<Session, 'started_at' | 'activity_id' | 'character_id'>;
  activity: Pick<Activity, 'name' | 'color'>;
}
