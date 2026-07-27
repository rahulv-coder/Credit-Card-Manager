'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Transaction, Card as CardType } from '@/lib/types';
import { getSpendingByCategory } from '@/lib/utils/calculations';
import { useTheme } from 'next-themes';

const COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
  '#84cc16', '#6366f1', '#d4af37',
];

interface Props {
  transactions: Transaction[];
  cards: CardType[];
}

function getMonthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export default function AnalyticsPage({ transactions, cards }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isFinance = mounted && resolvedTheme === 'finance';

  // ── Monthly spend trend (last 6 months) ──
  const monthlyTrend = useMemo(() => {
    const map: Record<string, { debit: number; credit: number }> = {};
    transactions.forEach(t => {
      const key = getMonthKey(t.date);
      if (!map[key]) map[key] = { debit: 0, credit: 0 };
      if (t.type === 'debit') map[key].debit += t.amount;
      else map[key].credit += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => ({ month: getMonthLabel(key), ...v }));
  }, [transactions]);

  // ── Spending by category ──
  const categoryData = useMemo(
    () => getSpendingByCategory(transactions).filter(d => d.amount > 0).slice(0, 10),
    [transactions]
  );

  // ── Card-by-card spending ──
  const cardSpend = useMemo(() => {
    return cards.map(card => {
      const spent = transactions.filter(t => t.cardId === card.id && t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      return { name: card.name, spent };
    }).sort((a, b) => b.spent - a.spent);
  }, [cards, transactions]);

  const cardStyle = isFinance
    ? {
        background: 'rgba(212,175,55,0.05)',
        border: '1px solid rgba(212,175,55,0.20)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }
    : undefined;

  const axisColor = isFinance ? 'rgba(212,175,55,0.50)' : 'var(--muted-foreground)';
  const gridColor = isFinance ? 'rgba(212,175,55,0.10)' : 'var(--border)';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your spending patterns</p>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-12 text-center border border-border">
          <p className="text-muted-foreground">No transactions yet. Add some to see analytics.</p>
        </Card>
      ) : (
        <>
          {/* Monthly Trend */}
          <Card className="p-6 border border-border shadow-sm" style={cardStyle}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Spend vs Credit (Last 6 months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                <Bar dataKey="debit" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="credit" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category donut */}
            <Card className="p-6 border border-border shadow-sm" style={cardStyle}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Spending Categories</h3>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-52 h-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {categoryData.map((item, i) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground truncate max-w-[110px]">{item.category}</span>
                      </div>
                      <span className="font-medium text-foreground shrink-0">
                        ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Card-by-card spend */}
            <Card className="p-6 border border-border shadow-sm" style={cardStyle}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Spending per Card</h3>
              {cardSpend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No card data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cardSpend} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: axisColor }} width={80} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Spent']} />
                    <Bar dataKey="spent" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Month-over-month line chart */}
          {monthlyTrend.length > 1 && (
            <Card className="p-6 border border-border shadow-sm" style={cardStyle}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Expense Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                  <Line type="monotone" dataKey="debit" name="Expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="credit" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
