'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lending, LendingPayment } from '@/lib/types';

const LENDINGS_KEY = 'ccm_lendings_';
const PAYMENTS_KEY = 'ccm_lending_payments_';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useLendings(userId?: string) {
  const lKey = LENDINGS_KEY + (userId || 'default');
  const pKey = PAYMENTS_KEY + (userId || 'default');

  const [lendings, setLendings] = useState<Lending[]>([]);
  const [payments, setPayments] = useState<LendingPayment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const l = localStorage.getItem(lKey);
      const p = localStorage.getItem(pKey);
      setLendings(l ? JSON.parse(l) : []);
      setPayments(p ? JSON.parse(p) : []);
    } catch {
      setLendings([]);
      setPayments([]);
    }
    setLoaded(true);
  }, [lKey, pKey]);

  const persist = useCallback(
    (nextLendings: Lending[], nextPayments: LendingPayment[]) => {
      setLendings(nextLendings);
      setPayments(nextPayments);
      localStorage.setItem(lKey, JSON.stringify(nextLendings));
      localStorage.setItem(pKey, JSON.stringify(nextPayments));
    },
    [lKey, pKey]
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
