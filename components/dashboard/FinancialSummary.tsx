'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatting';
import { CreditCard, Wallet, TrendingUp, Calendar, Banknote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FinancialSummaryProps {
  totalCreditLimit: number;
  totalBalance: number;
  availableCredit: number;
  totalEMIDue: number;
  totalLoans: number;
}

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  isFinance: boolean;
}

const SummaryCard = ({ icon: Icon, label, value, color, isFinance }: SummaryCardProps) => {
  if (isFinance) {
    return (
      <div
        className="p-4 md:p-5 rounded-xl transition-all duration-300 hover:scale-[1.015] cursor-default"
        style={{
          background: 'linear-gradient(145deg, rgba(212,175,55,0.10) 0%, rgba(0,0,0,0.25) 100%)',
          border: '1px solid rgba(212,175,55,0.24)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(212,175,55,0.12)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs md:text-sm font-medium" style={{ color: 'rgba(212,175,55,0.65)' }}>
              {label}
            </p>
            <p className="text-xl md:text-2xl font-bold" style={{ color: '#f5f0e0' }}>
              {value}
            </p>
          </div>
          <div
            className={`p-2.5 rounded-lg ${color}`}
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.45)', opacity: 0.90 }}
          >
            <Icon size={18} className="text-white" />
          </div>
        </div>
        {/* Gold shimmer accent line */}
        <div
          className="mt-3 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)' }}
        />
      </div>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-linear-to-br from-white to-secondary dark:from-card dark:to-secondary border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );
};

export default function FinancialSummary({
  totalCreditLimit,
  totalBalance,
  availableCredit,
  totalEMIDue,
  totalLoans,
}: FinancialSummaryProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isFinance = mounted && resolvedTheme === 'finance';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <SummaryCard icon={CreditCard}  label="Credit Limit"       value={formatCurrency(totalCreditLimit)} color="bg-blue-500"   isFinance={isFinance} />
      <SummaryCard icon={TrendingUp}  label="Current Spending"   value={formatCurrency(totalBalance)}     color="bg-red-500"    isFinance={isFinance} />
      <SummaryCard icon={Wallet}      label="Available Credit"   value={formatCurrency(availableCredit)}  color="bg-green-500"  isFinance={isFinance} />
      <SummaryCard icon={Calendar}    label="EMI Due This Month"  value={formatCurrency(totalEMIDue)}      color="bg-amber-500"  isFinance={isFinance} />
      <SummaryCard icon={Banknote}    label="Active Loans"        value={totalLoans}                       color="bg-purple-500" isFinance={isFinance} />
    </div>
  );
}

