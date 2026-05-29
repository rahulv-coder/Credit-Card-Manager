'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, Calendar, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: CreditCard,
      label: 'Add Card',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => router.push('/cards?modal=add-card'),
    },
    {
      icon: Banknote,
      label: 'Add Loan',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => router.push('/loans?modal=add-loan'),
    },
    {
      icon: Calendar,
      label: 'Add EMI',
      color: 'bg-amber-500 hover:bg-amber-600',
      onClick: () => router.push('/emis?modal=add-emi'),
    },
    {
      icon: Plus,
      label: 'Add Expense',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => router.push('/cards?modal=add-transaction'),
    },
  ];

  return (
    <Card className="p-6 border border-border shadow-sm h-full">
      <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              onClick={action.onClick}
              className={`${action.color} text-white h-auto flex flex-col items-center gap-2 py-6 transition-all`}
            >
              <Icon size={24} />
              <span className="text-xs text-center">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
