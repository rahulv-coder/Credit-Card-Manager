'use client';

import React from 'react';
import { Card as CardType, Transaction } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateCardBalance } from '@/lib/utils/calculations';
import { formatCurrency, formatDate, getCategoryIcon } from '@/lib/utils/formatting';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useData } from '@/lib/context/DataContext';

interface CardDetailsProps {
  card: CardType;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditCard?: () => void;
}

export default function CardDetails({
  card,
  transactions,
  onAddTransaction,
  onEditCard,
}: CardDetailsProps) {
  const { deleteTransaction } = useData();
  const balance = calculateCardBalance(card.id, transactions);
  const availableCredit = card.creditLimit - balance;
  const utilizationPercent = (balance / card.creditLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Balance and Limit */}
      <Card className="p-6 border border-border shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Card Summary</h3>
          {onEditCard && (
            <Button size="sm" variant="outline" onClick={onEditCard} className="gap-2">
              <Edit2 size={16} />
              <span className="hidden sm:inline">Edit Card</span>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Credit Limit</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(card.creditLimit)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Current Balance</p>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(balance)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Available Credit</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(availableCredit)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-foreground">Credit Utilization</p>
            <p className="font-semibold text-foreground">{utilizationPercent.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                utilizationPercent > 80 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Billing Cycle Info */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Billing Cycle Day</p>
            <p className="text-lg font-semibold text-foreground">{card.billingCycleDay}th of every month</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Payment Due</p>
            <p className="text-lg font-semibold text-orange-500">{card.paymentDueDays} days after billing cycle</p>
            <p className="text-xs text-muted-foreground mt-1">Payment deadline: {card.billingCycleDay}th + {card.paymentDueDays} days</p>
          </div>
        </div>
      </Card>

      {/* Transactions */}
      <Card className="p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Transactions</h3>
          <Button onClick={onAddTransaction} size="sm" className="gap-2">
            <Plus size={16} />
            Add Transaction
          </Button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions for this card yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions
              .sort((a, b) => b.date - a.date)
              .map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getCategoryIcon(transaction.category)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm">
                        -{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    </div>
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
