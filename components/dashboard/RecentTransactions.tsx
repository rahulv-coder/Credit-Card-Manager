'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction, Card as CardType } from '@/lib/types';
import { formatCurrency, formatDate, getCategoryIcon } from '@/lib/utils/formatting';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RecentTransactionsProps {
  transactions: Transaction[];
  cards: CardType[];
}

export default function RecentTransactions({ transactions, cards }: RecentTransactionsProps) {
  const getCardName = (cardId: string) => {
    return cards.find(c => c.id === cardId)?.name || 'Unknown Card';
  };

  return (
    <Card className="p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <Link href="/cards">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No transactions yet. Add one from your cards.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getCategoryIcon(transaction.category)}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{getCardName(transaction.cardId)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground text-sm">
                  {transaction.type === 'debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
