import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Session, SessionItem, Currency } from '@/types/database';

const SESSIONS_KEY = ['sessions'];
const ITEMS_KEY = ['session_items'];

export interface NewSessionInput {
  activity_id: string;
  character_id: string;
  started_at: string;
  duration_min: number;
  profit_gold: number;
  service_tc: number;
  notes?: string | null;
  items: {
    item_name: string;
    quantity: number;
    sold_price?: number | null;
    sold_currency?: Currency | null;
  }[];
}

export function useSessions(range?: { from?: string; to?: string }) {
  return useQuery({
    // chave com primitivos (não o objeto range) pra ficar estável entre renders
    queryKey: [...SESSIONS_KEY, range?.from ?? null, range?.to ?? null],
    queryFn: async () => {
      let q = supabase.from('sessions').select('*').order('started_at', { ascending: false });
      if (range?.from) q = q.gte('started_at', range.from);
      if (range?.to) q = q.lte('started_at', range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });
}

export function useSessionItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SessionItem[];
    },
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewSessionInput) => {
      const { items, ...sessionInput } = input;
      const { data: session, error } = await supabase
        .from('sessions')
        .insert(sessionInput)
        .select('*')
        .single();
      if (error) throw error;

      if (items.length > 0) {
        const rows = items.map((i) => {
          const sold = i.sold_price != null;
          return {
            session_id: session.id,
            item_name: i.item_name,
            quantity: i.quantity,
            // pendente: preço, moeda e data ficam TODOS null (CHECK aceita null)
            sold_price: sold ? i.sold_price : null,
            sold_currency: sold ? (i.sold_currency ?? 'gold') : null,
            sold_at: sold ? input.started_at : null,
          };
        });
        const { error: e2 } = await supabase.from('session_items').insert(rows);
        if (e2) {
          // sem transação no client: desfaz a sessão pra não deixar ela órfã sem os itens
          await supabase.from('sessions').delete().eq('id', session.id);
          throw e2;
        }
      }

      return session as Session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export interface EditSessionInput extends Omit<NewSessionInput, 'items'> {
  id: string;
  /** Itens com id = já existiam; sem id = novos. Itens existentes ausentes são apagados. */
  items: (NewSessionInput['items'][number] & { id?: string })[];
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items, ...patch }: EditSessionInput) => {
      const { error } = await supabase.from('sessions').update(patch).eq('id', id);
      if (error) throw error;

      const { data: existing, error: eRead } = await supabase
        .from('session_items')
        .select('*')
        .eq('session_id', id);
      if (eRead) throw eRead;
      const before = new Map((existing as SessionItem[]).map((i) => [i.id, i]));

      const keptIds = new Set(items.filter((i) => i.id).map((i) => i.id!));
      const removed = [...before.keys()].filter((itemId) => !keptIds.has(itemId));
      if (removed.length > 0) {
        const { error: eDel } = await supabase.from('session_items').delete().in('id', removed);
        if (eDel) throw eDel;
      }

      for (const i of items) {
        const sold = i.sold_price != null;
        const prev = i.id ? before.get(i.id) : undefined;
        // Item entra no mês da VENDA: se já estava vendido mantém a data da venda;
        // se era pendente e ganhou preço agora, a venda é agora; item novo com preço
        // conta na data da sessão (igual ao cadastro).
        const soldAt = !sold
          ? null
          : prev
            ? (prev.sold_at ?? new Date().toISOString())
            : patch.started_at;
        const row = {
          item_name: i.item_name,
          quantity: i.quantity,
          sold_price: sold ? i.sold_price : null,
          sold_currency: sold ? (i.sold_currency ?? 'gold') : null,
          sold_at: soldAt,
        };
        const { error: eItem } = prev
          ? await supabase.from('session_items').update(row).eq('id', prev.id)
          : await supabase.from('session_items').insert({ ...row, session_id: id });
        if (eItem) throw eItem;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useSellItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      sold_price: number;
      sold_currency: Currency;
      sold_at: string;
    }) => {
      const { error } = await supabase
        .from('session_items')
        .update({
          sold_price: input.sold_price,
          sold_currency: input.sold_currency,
          sold_at: input.sold_at,
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('session_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}
