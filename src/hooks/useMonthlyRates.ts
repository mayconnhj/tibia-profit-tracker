import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MonthlyRate } from '@/types/database';

const KEY = ['monthly_rates'];

export function useMonthlyRates() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_rates')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MonthlyRate[];
    },
  });
}

export function useCurrentRate() {
  const { data } = useMonthlyRates();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return data?.find((r) => r.year === y && r.month === m) ?? null;
}

export function useUpsertRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      year: number;
      month: number;
      tc_to_gold: number;
      tc_to_brl: number;
    }) => {
      const { data, error } = await supabase
        .from('monthly_rates')
        .upsert(input, { onConflict: 'year,month' })
        .select('*')
        .single();
      if (error) throw error;
      return data as MonthlyRate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
