'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lending, LendingPayment } from '@/lib/types';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type LendingRow = {
  id: string;
  user_id: string;
  person_name: string;
  phone: string;
  original_amount: number;
  remaining_amount: number;
  purpose: string;
  lent_date: number;
  due_date: number | null;
  repayment_type: 'full' | 'installment';
  monthly_amount: number | null;
  monthly_due_day: number | null;
  notes: string;
  created_at: number;
};

type PaymentRow = {
  id: string;
  user_id: string;
  lending_id: string;
  amount: number;
  date: number;
  notes: string;
  created_at: number;
};

const toLending = (row: LendingRow): Lending => ({
  id: row.id,
  personName: row.person_name,
  phone: row.phone,
  originalAmount: Number(row.original_amount),
  remainingAmount: Number(row.remaining_amount),
  purpose: row.purpose,
  lentDate: row.lent_date,
  dueDate: row.due_date ?? undefined,
  repaymentType: row.repayment_type,
  monthlyAmount: row.monthly_amount === null ? undefined : Number(row.monthly_amount),
  monthlyDueDay: row.monthly_due_day ?? undefined,
  notes: row.notes,
  createdAt: row.created_at,
});

const toPayment = (row: PaymentRow): LendingPayment => ({
  id: row.id,
  lendingId: row.lending_id,
  amount: Number(row.amount),
  date: row.date,
  notes: row.notes,
  createdAt: row.created_at,
});

const toLendingRow = (userId: string, lending: Lending) => ({
  id: lending.id,
  user_id: userId,
  person_name: lending.personName,
  phone: lending.phone,
  original_amount: lending.originalAmount,
  remaining_amount: lending.remainingAmount,
  purpose: lending.purpose,
  lent_date: lending.lentDate,
  due_date: lending.dueDate ?? null,
  repayment_type: lending.repaymentType,
  monthly_amount: lending.monthlyAmount ?? null,
  monthly_due_day: lending.monthlyDueDay ?? null,
  notes: lending.notes,
  created_at: lending.createdAt,
});

const toPaymentRow = (userId: string, payment: LendingPayment) => ({
  id: payment.id,
  user_id: userId,
  lending_id: payment.lendingId,
  amount: payment.amount,
  date: payment.date,
  notes: payment.notes,
  created_at: payment.createdAt,
});

export function useLendings(userId?: string) {
  const supabase = getSupabaseBrowserClient();

  const [lendings, setLendings] = useState<Lending[]>([]);
  const [payments, setPayments] = useState<LendingPayment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoaded(false);

      if (!supabase || !userId) {
        if (!cancelled) {
          setLendings([]);
          setPayments([]);
          setLoaded(true);
        }
        return;
      }

      const [{ data: lendingRows, error: lendingError }, { data: paymentRows, error: paymentError }] = await Promise.all([
        supabase.from('lendings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('lending_payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      if (lendingError || paymentError) {
        console.error('[useLendings] load error:', lendingError || paymentError);
        setLendings([]);
        setPayments([]);
        setLoaded(true);
        return;
      }

      const remoteLendings = ((lendingRows ?? []) as LendingRow[]).map(toLending);
      const remotePayments = ((paymentRows ?? []) as PaymentRow[]).map(toPayment);

      setLendings(remoteLendings);
      setPayments(remotePayments);

      setLoaded(true);
    };

    load();

    return () => { cancelled = true; };
  }, [supabase, userId]);

  const persist = useCallback(
    async (nextLendings: Lending[], nextPayments: LendingPayment[]) => {
      setLendings(nextLendings);
      setPayments(nextPayments);

      if (!supabase || !userId) return;

      const { error: deletePaymentsError } = await supabase.from('lending_payments').delete().eq('user_id', userId);
      if (deletePaymentsError) {
        console.error('[useLendings] delete payments error:', deletePaymentsError);
        return;
      }

      const { error: deleteLendingsError } = await supabase.from('lendings').delete().eq('user_id', userId);
      if (deleteLendingsError) {
        console.error('[useLendings] delete lendings error:', deleteLendingsError);
        return;
      }

      if (nextLendings.length > 0) {
        const { error } = await supabase.from('lendings').insert(nextLendings.map((lending) => toLendingRow(userId, lending)));
        if (error) {
          console.error('[useLendings] insert lendings error:', error);
          return;
        }
      }

      if (nextPayments.length > 0) {
        const { error } = await supabase.from('lending_payments').insert(nextPayments.map((payment) => toPaymentRow(userId, payment)));
        if (error) console.error('[useLendings] insert payments error:', error);
      }
    },
    [supabase, userId]
  );

  const addLending = useCallback(
    (input: Omit<Lending, 'id' | 'createdAt' | 'remainingAmount'>) => {
      const lending: Lending = {
        ...input,
        id: genId(),
        remainingAmount: input.originalAmount,
        createdAt: Date.now(),
      };
      persist([...lendings, lending], payments);
      return lending.id;
    },
    [lendings, payments, persist]
  );

  const editLending = useCallback(
    (id: string, updates: Partial<Omit<Lending, 'id' | 'createdAt'>>) => {
      const next = lendings.map((l) => (l.id === id ? { ...l, ...updates } : l));
      persist(next, payments);
    },
    [lendings, payments, persist]
  );

  const deleteLending = useCallback(
    (id: string) => {
      persist(
        lendings.filter((l) => l.id !== id),
        payments.filter((p) => p.lendingId !== id)
      );
    },
    [lendings, payments, persist]
  );

  const recordPayment = useCallback(
    (lendingId: string, amount: number, date: number, notes: string) => {
      const payment: LendingPayment = {
        id: genId(),
        lendingId,
        amount,
        date,
        notes,
        createdAt: Date.now(),
      };
      const nextLendings = lendings.map((l) =>
        l.id === lendingId
          ? { ...l, remainingAmount: Math.max(0, l.remainingAmount - amount) }
          : l
      );
      persist(nextLendings, [...payments, payment]);
    },
    [lendings, payments, persist]
  );

  const deletePayment = useCallback(
    (paymentId: string) => {
      const pmt = payments.find((p) => p.id === paymentId);
      if (!pmt) return;
      const nextLendings = lendings.map((l) =>
        l.id === pmt.lendingId
          ? { ...l, remainingAmount: l.remainingAmount + pmt.amount }
          : l
      );
      persist(
        nextLendings,
        payments.filter((p) => p.id !== paymentId)
      );
    },
    [lendings, payments, persist]
  );

  const getPaymentsForLending = useCallback(
    (lendingId: string) => payments.filter((p) => p.lendingId === lendingId),
    [payments]
  );

  const totalOutstanding = lendings.reduce((s, l) => s + l.remainingAmount, 0);
  const totalLent = lendings.reduce((s, l) => s + l.originalAmount, 0);
  const settledCount = lendings.filter((l) => l.remainingAmount === 0).length;
  const activeCount = lendings.filter((l) => l.remainingAmount > 0).length;

  return {
    lendings,
    payments,
    loaded,
    addLending,
    editLending,
    deleteLending,
    recordPayment,
    deletePayment,
    getPaymentsForLending,
    totalOutstanding,
    totalLent,
    settledCount,
    activeCount,
  };
}
