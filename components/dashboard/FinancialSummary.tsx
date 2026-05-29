'use client';

import React from 'react';
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
}

const SummaryCard = ({ icon: Icon, label, value, color }: SummaryCardProps) => (
  <Card className="p-4 md:p-6 bg-gradient-to-br from-white to-secondary dark:from-card dark:to-secondary border-0 shadow-sm hover:shadow-md transition-shadow">
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

export default function FinancialSummary({
  totalCreditLimit,
  totalBalance,
  availableCredit,
  totalEMIDue,
  totalLoans,
}: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <SummaryCard
        icon={CreditCard}
        label="Credit Limit"
        value={formatCurrency(totalCreditLimit)}
        color="bg-blue-500"
      />
      <SummaryCard
        icon={TrendingUp}
        label="Current Spending"
        value={formatCurrency(totalBalance)}
        color="bg-red-500"
      />
      <SummaryCard
        icon={Wallet}
        label="Available Credit"
        value={formatCurrency(availableCredit)}
        color="bg-green-500"
      />
      <SummaryCard
        icon={Calendar}
        label="EMI Due This Month"
        value={formatCurrency(totalEMIDue)}
        color="bg-amber-500"
      />
      <SummaryCard
        icon={Banknote}
        label="Active Loans"
        value={totalLoans}
        color="bg-purple-500"
      />
    </div>
  );
}
