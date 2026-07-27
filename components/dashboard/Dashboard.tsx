'use client';

import React from 'react';
import { useData } from '@/lib/context/DataContext';
import {
  calculateTotalBalance,
  calculateTotalCreditLimit,
  calculateAvailableCredit,
  calculateTotalEMIDue,
  getRecentTransactions,
  getUpcomingEMIs,
} from '@/lib/utils/calculations';
import FinancialSummary from './FinancialSummary';
import RecentTransactions from './RecentTransactions';
import UpcomingEMIs from './UpcomingEMIs';
import QuickActions from './QuickActions';
import SpendingChart from './SpendingChart';
import SpendingByCategory from './SpendingByCategory';
import CardBillsDue from './CardBillsDue';

export default function Dashboard() {
  const { data, profile, user } = useData();
  const firstName = profile?.firstName || user?.email?.split('@')[0] || 'there';

  const totalBalance = calculateTotalBalance(data.cards, data.transactions);
  const totalCreditLimit = calculateTotalCreditLimit(data.cards);
  const availableCredit = calculateAvailableCredit(data.cards, data.transactions);
  const totalEMIDue = calculateTotalEMIDue(data.emis);
  const recentTransactions = getRecentTransactions(data.transactions, 5);
  const upcomingEMIs = getUpcomingEMIs(data.emis, 5);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {firstName}! Here&apos;s your financial overview.</p>
      </div>

      {/* Financial Summary */}
      <FinancialSummary
        totalCreditLimit={totalCreditLimit}
        totalBalance={totalBalance}
        availableCredit={availableCredit}
        totalEMIDue={totalEMIDue}
        totalLoans={data.loans.length}
      />

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart transactions={data.transactions} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Transactions and Upcoming EMIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={recentTransactions} cards={data.cards} />
        <UpcomingEMIs emis={upcomingEMIs} loans={data.loans} />
      </div>

      {/* Spending by Category + Card Bills Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingByCategory transactions={data.transactions} />
        <CardBillsDue cards={data.cards} />
      </div>
    </div>
  );
}
