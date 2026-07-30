'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function useMonthlyBudget(userId?: string) {
  const [salary, setSalaryState] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let cancelled = false;

    const loadSalary = async () => {
      setLoaded(false);

      if (!supabase || !userId) {
        if (!cancelled) {
          setSalaryState(0);
          setLoaded(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('monthly_salary')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('[useMonthlyBudget] load error:', error);
        setSalaryState(0);
        setLoaded(true);
        return;
      }

      if (data) {
        setSalaryState(Number(data.monthly_salary) || 0);
        setLoaded(true);
        return;
      }

      setSalaryState(0);
      setLoaded(true);
    };

    loadSalary();

    return () => { cancelled = true; };
  }, [supabase, userId]);

  const setSalary = useCallback(
    async (amount: number) => {
      const clamped = Math.max(0, amount);
      setSalaryState(clamped);

      if (supabase && userId) {
        const { error } = await supabase.from('monthly_budgets').upsert({
          user_id: userId,
          monthly_salary: clamped,
          updated_at: Date.now(),
        });
        if (error) console.error('[useMonthlyBudget] save error:', error);
      }
    },
    [supabase, userId]
  );

  return { salary, setSalary, loaded };
}
