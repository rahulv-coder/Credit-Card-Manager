'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'ccm_monthly_salary_';

export function useMonthlyBudget(userId?: string) {
  const key = STORAGE_KEY_PREFIX + (userId || 'default');
  const [salary, setSalaryState] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    setSalaryState(stored ? parseFloat(stored) || 0 : 0);
    setLoaded(true);
  }, [key]);

  const setSalary = useCallback(
    (amount: number) => {
      const clamped = Math.max(0, amount);
      setSalaryState(clamped);
      localStorage.setItem(key, String(clamped));
    },
    [key]
  );

  return { salary, setSalary, loaded };
}
