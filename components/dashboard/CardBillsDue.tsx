'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Card as CardType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatting';
import { CreditCard, AlertCircle, Clock } from 'lucide-react';

interface Props {
  cards: CardType[];
}

function getNextBillingDate(billingCycleDay: number): Date {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), billingCycleDay);
  if (thisMonth <= today) {
    thisMonth.setMonth(thisMonth.getMonth() + 1);
  }
  return thisMonth;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CardBillsDue({ cards }: Props) {
  if (cards.length === 0) return null;

  const bills = cards.map((card) => {
    const billingDate = getNextBillingDate(card.billingCycleDay);
    const dueDate = new Date(billingDate);
    dueDate.setDate(dueDate.getDate() + card.paymentDueDays);
    const daysUntilBilling = getDaysUntil(billingDate);
    const daysUntilDue = getDaysUntil(dueDate);
    return { card, billingDate, dueDate, daysUntilBilling, daysUntilDue };
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <Card className="p-6 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Upcoming Card Bills</h3>
      </div>

      <div className="space-y-3">
        {bills.map(({ card, billingDate, dueDate, daysUntilBilling, daysUntilDue }) => {
          const isUrgent = daysUntilDue <= 3;
          const isWarning = daysUntilDue <= 7;

          return (
            <div
              key={card.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isUrgent
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  : isWarning
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                  : 'bg-secondary border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: card.color }}
                >
                  {card.issuer.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Billing: {billingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·
                    Due: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  {isUrgent ? (
                    <AlertCircle size={13} className="text-red-500" />
                  ) : isWarning ? (
                    <Clock size={13} className="text-amber-500" />
                  ) : null}
                  <span className={`text-sm font-semibold ${isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-500'}`}>
                    {daysUntilDue === 0 ? 'Due Today' : daysUntilDue < 0 ? 'Overdue' : `${daysUntilDue}d left`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Balance: {formatCurrency(card.currentBalance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
