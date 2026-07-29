'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/lib/types';
import { useTheme } from 'next-themes';
import { AlertTriangle, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  salary: number;
  salaryLoaded: boolean;
}

function getCurrentMonthSpend(transactions: Transaction[]): number {
  const now = new Date();
  return transactions
    .filter((t) => {
      if (t.type !== 'debit') return false;
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

function getCurrentMonthIncome(transactions: Transaction[]): number {
  const now = new Date();
  return transactions
    .filter((t) => {
      if (t.type !== 'credit') return false;
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// SVG circular progress — always full circle ring, fill up clockwise
function CircularProgress({
  percent,
  isOver,
  size = 160,
}: {
  percent: number;
  isOver: boolean;
  size?: number;
}) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const clampedPct = Math.min(Math.max(percent, 0), 100);
  const offset = circ * (1 - clampedPct / 100);

  const trackColor = 'var(--secondary)';
  const fillColor = isOver ? '#ef4444' : clampedPct > 80 ? '#f59e0b' : '#10b981';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={12}
      />
      {/* fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={fillColor}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
      />
    </svg>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SalaryTracker({ transactions, salary, salaryLoaded }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isFinance = mounted && resolvedTheme === 'finance';

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const spent = useMemo(() => getCurrentMonthSpend(transactions), [transactions]);
  const income = useMemo(() => getCurrentMonthIncome(transactions), [transactions]);

  const hasSalary = salary > 0;
  const remaining = salary - spent;
  const isOver = remaining < 0;
  const percentUsed = hasSalary ? Math.min((spent / salary) * 100, 100) : 0;
  const isWarning = !isOver && percentUsed >= 80;

  const formatINR = (n: number) =>
    '₹' +
    Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const cardStyle = isFinance
    ? {
        background: 'rgba(212,175,55,0.05)',
        border: '1px solid rgba(212,175,55,0.20)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }
    : undefined;

  return (
    <Card className="p-6 border border-border shadow-sm" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Wallet size={20} className="text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground leading-tight">Monthly Salary Tracker</h3>
          <p className="text-xs text-muted-foreground">{monthLabel}</p>
        </div>
      </div>

      {!salaryLoaded ? null : !hasSalary ? (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <Wallet size={32} className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Set your monthly salary in <strong>Settings → Salary & Budget</strong> to track spending vs income.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Circular chart */}
          <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
            <CircularProgress percent={percentUsed} isOver={isOver} size={160} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-bold leading-none"
                style={{ color: isOver ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--foreground)' }}
              >
                {percentUsed.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">used</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 w-full space-y-3">
            {/* Monthly salary */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Monthly Salary</span>
              <span className="font-semibold text-foreground">{formatINR(salary)}</span>
            </div>

            {/* Spent this month */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-red-400" />
                <span className="text-sm text-muted-foreground">Spent this month</span>
              </div>
              <span className="font-semibold text-red-400">{formatINR(spent)}</span>
            </div>

            {/* Credit income this month */}
            {income > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-sm text-muted-foreground">Credited this month</span>
                </div>
                <span className="font-semibold text-green-500">{formatINR(income)}</span>
              </div>
            )}

            {/* Remaining / Deficit */}
            <div
              className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                isOver
                  ? 'bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800'
                  : isWarning
                  ? 'bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800'
                  : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isOver && <AlertTriangle size={14} className="text-red-500" />}
                <span className={`text-sm font-medium ${isOver ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isOver ? 'Over Budget' : 'Remaining'}
                </span>
              </div>
              <span className={`text-lg font-bold ${isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-500'}`}>
                {isOver ? `-${formatINR(Math.abs(remaining))}` : formatINR(remaining)}
              </span>
            </div>

            {/* Over-budget warning */}
            {isOver && (
              <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 leading-snug">
                  You have exceeded your monthly salary by{' '}
                  <strong>{formatINR(Math.abs(remaining))}</strong>. Consider reviewing your spending.
                </p>
              </div>
            )}

            {/* 80% warning */}
            {isWarning && !isOver && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400 leading-snug">
                  You have used <strong>{percentUsed.toFixed(0)}%</strong> of your monthly salary. Slow down!
                </p>
              </div>
            )}

            {/* Linear bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹0</span>
                <span>{formatINR(salary)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(percentUsed, 100)}%`,
                    background: isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
