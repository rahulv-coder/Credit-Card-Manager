'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EMI, Loan } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface UpcomingEMIsProps {
  emis: EMI[];
  loans: Loan[];
}

export default function UpcomingEMIs({ emis, loans }: UpcomingEMIsProps) {
  const getLoanName = (loanId: string) => {
    return loans.find(l => l.id === loanId)?.name || 'Unknown Loan';
  };

  const getDaysUntilDue = (dueDate: number) => {
    const now = Date.now();
    const days = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card className="p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Upcoming EMIs</h3>
        <Link href="/emis">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {emis.length === 0 ? (
        <p className="text-muted-foreground text-sm">No upcoming EMIs. Create a loan to get started.</p>
      ) : (
        <div className="space-y-3">
          {emis.map((emi) => {
            const daysUntilDue = getDaysUntilDue(emi.dueDate);
            const isUrgent = daysUntilDue <= 7;

            return (
              <div
                key={emi.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isUrgent
                    ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                    : 'bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isUrgent && <AlertCircle size={18} className="text-red-500" />}
                  <div>
                    <p className="font-medium text-foreground text-sm">{getLoanName(emi.loanId)}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(emi.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm">
                    {formatCurrency(emi.emiAmount)}
                  </p>
                  <p className={`text-xs ${isUrgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    {daysUntilDue} days left
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
