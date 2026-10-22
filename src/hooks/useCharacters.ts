import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/types/database';

const KEY = ['characters'];

export function useCharacters() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').order('created_at');
      if (error) throw error;
      return (data ?? []) as Character[];
    },
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; vocation?: string; world?: string }) => {
      const { data, error } = await supabase
        .from('characters')
        .insert(input)
        .select('*')
        .single();
      if (error) throw error;
      return data as Character;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      vocation: string | null;
      world: string | null;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from('characters').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Apaga de verdade. sessions/expenses.character_id são ON DELETE RESTRICT, então
 * as sessões (itens vão por cascade) e despesas do personagem são apagadas antes.
 * Quem chama é responsável por confirmar com o usuário.
 */
export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: e1 } = await supabase.from('sessions').delete().eq('character_id', id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('expenses').delete().eq('character_id', id);
      if (e2) throw e2;
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
