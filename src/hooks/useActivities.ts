import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Activity, ActivityType } from '@/types/database';

const KEY = ['activities'];

/**
 * Ordem manual (coluna position, migration 005); sem posição vai pro fim, por data.
 * Ordenado aqui e não no SQL pra continuar funcionando antes da migration existir.
 */
function byPosition(a: Activity, b: Activity): number {
  const pa = a.position ?? Number.MAX_SAFE_INTEGER;
  const pb = b.position ?? Number.MAX_SAFE_INTEGER;
  return pa - pb || a.created_at.localeCompare(b.created_at);
}

export function useActivities() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('archived', false);
      if (error) throw error;
      return ((data ?? []) as Activity[]).sort(byPosition);
    },
  });
}

/** Inclui arquivadas: pra resolver nomes de sessões/itens antigos. */
export function useAllActivities() {
  return useQuery({
    queryKey: [...KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*');
      if (error) throw error;
      return ((data ?? []) as Activity[]).sort(byPosition);
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; type: ActivityType; color: string }) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(input)
        .select('*')
        .single();
      if (error) throw error;
      return data as Activity;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Edita nome/tipo/cor ou arquiva/desarquiva. */
export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<Activity, 'name' | 'type' | 'color' | 'archived'>>) => {
      const { error } = await supabase.from('activities').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Salva a ordem arrastada na tela de lançamentos (ids na nova ordem). */
export function useReorderActivities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const results = await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('activities').update({ position: i + 1 }).eq('id', id),
        ),
      );
      const error = results.find((r) => r.error)?.error;
      if (error) {
        if (error.code === '42703' || /position/.test(error.message))
          throw new Error('Rode a migration 005_activity_position.sql no Supabase pra salvar a ordem.');
        throw error;
      }
    },
    // otimista: a lista já aparece na ordem nova enquanto salva
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: KEY, exact: true });
      const prev = qc.getQueryData<Activity[]>(KEY);
      if (prev) {
        const byId = new Map(prev.map((a) => [a.id, a]));
        qc.setQueryData(
          KEY,
          orderedIds.map((id, i) => ({ ...byId.get(id)!, position: i + 1 })).filter((a) => a.id),
        );
      }
      return { prev };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Apaga de verdade. sessions.activity_id é ON DELETE RESTRICT, então as sessões
 * da atividade (e, por cascade, os itens delas) são apagadas antes.
 * Quem chama é responsável por confirmar com o usuário.
 */
export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: e1 } = await supabase.from('sessions').delete().eq('activity_id', id);
      if (e1) throw e1;
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    // mexe em atividades, sessões e itens
    onSuccess: () => qc.invalidateQueries(),
  });
}
