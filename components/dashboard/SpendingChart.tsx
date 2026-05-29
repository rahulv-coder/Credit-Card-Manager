'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Transaction } from '@/lib/types';
import { getMonthlySummary } from '@/lib/utils/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SpendingChartProps {
  transactions: Transaction[];
}

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const data = getMonthlySummary(transactions);

  return (
    <Card className="p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-6">Monthly Spending Trend</h3>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>No transaction data yet. Add some transactions to see trends.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              stroke="var(--muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
              formatter={(value: number | string) =>
                `₹${Number(value).toLocaleString('en-IN')}`
              }
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--primary)', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
