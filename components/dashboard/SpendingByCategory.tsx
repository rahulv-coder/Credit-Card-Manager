'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/lib/types';
import { getSpendingByCategory } from '@/lib/utils/calculations';
import { useTheme } from 'next-themes';

const COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
  '#84cc16', '#6366f1', '#d4af37',
];

interface Props {
  transactions: Transaction[];
}

export default function SpendingByCategory({ transactions }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isFinance = mounted && resolvedTheme === 'finance';

  const data = getSpendingByCategory(transactions).filter(d => d.amount > 0);

  if (data.length === 0) {
    return (
      <Card className="p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
        <p className="text-sm text-muted-foreground">No debit transactions yet to show spending breakdown.</p>
      </Card>
    );
  }

  const total = data.reduce((s, d) => s + d.amount, 0);

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
      <h3 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-56 h-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2 w-full">
          {data.slice(0, 8).map((item, i) => (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm text-foreground truncate max-w-[120px]">{item.category}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-medium text-foreground">
                  ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({((item.amount / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
          {data.length > 8 && (
            <p className="text-xs text-muted-foreground pt-1">+{data.length - 8} more categories</p>
          )}
        </div>
      </div>
    </Card>
  );
}
