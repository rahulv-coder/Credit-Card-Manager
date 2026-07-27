'use client';

import React, { useState, useMemo } from 'react';
import { Card as CardType, Transaction } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { calculateCardBalance } from '@/lib/utils/calculations';
import { formatCurrency, formatDate, getCategoryIcon } from '@/lib/utils/formatting';
import { Plus, Trash2, Edit2, Search, ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useData } from '@/lib/context/DataContext';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/categories';

const PAGE_SIZE = 10;

interface CardDetailsProps {
  card: CardType;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditCard?: () => void;
  onEditTransaction?: (t: Transaction) => void;
}

export default function CardDetails({
  card,
  transactions,
  onAddTransaction,
  onEditCard,
  onEditTransaction,
}: CardDetailsProps) {
  const { deleteTransaction } = useData();
  const balance = calculateCardBalance(card.id, transactions);
  const availableCredit = card.creditLimit - balance;
  const utilizationPercent = card.creditLimit > 0 ? (balance / card.creditLimit) * 100 : 0;

  // â”€â”€ Filter / search / sort state â”€â”€
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [sort, setSort] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === 'date-desc') return b.date - a.date;
      if (sort === 'date-asc') return a.date - b.date;
      if (sort === 'amount-desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });
    return list;
  }, [transactions, typeFilter, categoryFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      {/* Card Summary */}
      <Card className="p-6 border border-border shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Card Summary</h3>
          {onEditCard && (
            <Button size="sm" variant="outline" onClick={onEditCard} className="gap-2">
              <Edit2 size={16} /><span className="hidden sm:inline">Edit Card</span>
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

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-foreground">Credit Utilization</p>
            <p className={`font-semibold ${utilizationPercent > 80 ? 'text-red-500' : 'text-foreground'}`}>
              {utilizationPercent.toFixed(1)}%
            </p>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${utilizationPercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Billing Cycle Day</p>
            <p className="text-lg font-semibold text-foreground">{card.billingCycleDay}th of every month</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Payment Due</p>
            <p className="text-lg font-semibold text-orange-500">{card.paymentDueDays} days after billing cycle</p>
            <p className="text-xs text-muted-foreground mt-1">
              Deadline: {card.billingCycleDay}th + {card.paymentDueDays} days
            </p>
          </div>
        </div>
      </Card>

      {/* Transactions */}
      <Card className="p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Transactions
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h3>
          <Button onClick={onAddTransaction} size="sm" className="gap-2">
            <Plus size={16} /> Add
          </Button>
        </div>

        {/* Search & Filters */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactionsâ€¦"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); resetPage(); }}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); resetPage(); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <ArrowUpDown size={12} className="mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions for this card yet.</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions match your filters.</p>
        ) : (
          <>
            <div className="space-y-2">
              {paginated.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl shrink-0">{getCategoryIcon(t.category)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {t.type === 'credit'
                          ? <ArrowUpCircle size={12} className="text-green-500" />
                          : <ArrowDownCircle size={12} className="text-red-400" />}
                        <p className={`font-semibold text-sm ${t.type === 'credit' ? 'text-green-500' : 'text-foreground'}`}>
                          {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                    {onEditTransaction && (
                      <button
                        onClick={() => onEditTransaction(t)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-secondary rounded transition-all"
                      >
                        <Edit2 size={14} className="text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}â€“{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

