import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseCategory, Currency } from '@/types/database';

const KEY = ['expenses'];

export function useExpenses() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      character_id: string;
      occurred_at: string;
      category: ExpenseCategory;
      description?: string;
      amount: number;
      currency: Currency;
    }) => {
      const { data, error } = await supabase.from('expenses').insert(input).select('*').single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      character_id: string;
      occurred_at: string;
      category: ExpenseCategory;
      description: string | null;
      amount: number;
      currency: Currency;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from('expenses').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
