'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useLendings } from '@/hooks/use-lendings';
import { Lending } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddLendingModal from './AddLendingModal';
import RecordPaymentModal from './RecordPaymentModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Trash2, Edit2, IndianRupee, Users, CheckCircle2,
  Clock, AlertTriangle, ChevronDown, ChevronUp, Copy, Phone,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type LendingStatus = 'settled' | 'overdue' | 'due-soon' | 'active';

function getStatus(lending: Lending): LendingStatus {
  if (lending.remainingAmount === 0) return 'settled';
  const now = Date.now();
  if (lending.repaymentType === 'full' && lending.dueDate) {
    if (now > lending.dueDate) return 'overdue';
    if (lending.dueDate - now < 7 * 24 * 60 * 60 * 1000) return 'due-soon';
  }
  if (lending.repaymentType === 'installment' && lending.monthlyDueDay) {
    const today = new Date();
    const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), lending.monthlyDueDay);
    const diff = dueThisMonth.getTime() - now;
    if (diff < 0 && today.getDate() > lending.monthlyDueDay) return 'due-soon'; // just passed
    if (diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000) return 'due-soon';
  }
  return 'active';
}

function StatusBadge({ status }: { status: LendingStatus }) {
  const map = {
    settled: { label: 'Settled', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' },
    'due-soon': { label: 'Due Soon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    active: { label: 'Active', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

function copyReminder(lending: Lending) {
  const remaining = fmt(lending.remainingAmount);
  let msg = `Hi ${lending.personName}! 👋\n\nThis is a friendly reminder that you owe me ${remaining}`;
  if (lending.purpose) msg += ` (${lending.purpose})`;
  msg += '.';
  if (lending.repaymentType === 'full' && lending.dueDate) {
    msg += `\nExpected return date: ${fmtDate(lending.dueDate)}.`;
  }
  if (lending.repaymentType === 'installment' && lending.monthlyAmount && lending.monthlyDueDay) {
    msg += `\nMonthly payment: ${fmt(lending.monthlyAmount)} by the ${lending.monthlyDueDay}th of every month.`;
  }
  msg += '\n\nPlease let me know when you can transfer. Thank you! 🙏';
  navigator.clipboard.writeText(msg).catch(() => null);
}

// ── LendingCard ───────────────────────────────────────────────────────────────

interface LendingCardProps {
  lending: Lending;
  payments: ReturnType<ReturnType<typeof useLendings>['getPaymentsForLending']>;
  onEdit: () => void;
  onDelete: () => void;
  onRecord: () => void;
  onDeletePayment: (id: string) => void;
}

function LendingCard({ lending, payments, onEdit, onDelete, onRecord, onDeletePayment }: LendingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = getStatus(lending);
  const paidTotal = lending.originalAmount - lending.remainingAmount;
  const progressPct = lending.originalAmount > 0 ? (paidTotal / lending.originalAmount) * 100 : 0;
  const isSettled = lending.remainingAmount === 0;

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      {/* Top strip */}
      <div
        className="h-1 w-full"
        style={{
          background:
            status === 'settled' ? '#10b981'
            : status === 'overdue' ? '#ef4444'
            : status === 'due-soon' ? '#f59e0b'
            : '#3b82f6',
        }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground truncate">{lending.personName}</h3>
              <StatusBadge status={status} />
            </div>
            {lending.purpose && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{lending.purpose}</p>
            )}
            {lending.phone && (
              <div className="flex items-center gap-1 mt-1">
                <Phone size={11} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{lending.phone}</span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-foreground">{fmt(lending.originalAmount)}</p>
            <p className="text-xs text-muted-foreground">lent on {fmtDate(lending.lentDate)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Paid: <span className="text-green-500 font-medium">{fmt(paidTotal)}</span>
            </span>
            <span className="text-muted-foreground">
              Remaining: <span className={`font-medium ${isSettled ? 'text-green-500' : 'text-red-400'}`}>{fmt(lending.remainingAmount)}</span>
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progressPct, 100)}%`,
                background: isSettled ? '#10b981' : status === 'overdue' ? '#ef4444' : '#3b82f6',
              }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">{progressPct.toFixed(0)}% recovered</p>
        </div>

        {/* Due / installment info */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          {lending.repaymentType === 'full' && lending.dueDate && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
              status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              : status === 'due-soon' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
              : 'bg-secondary border-transparent text-muted-foreground'}`}>
              {status === 'overdue' ? <AlertTriangle size={10} /> : <Clock size={10} />}
              Due: {fmtDate(lending.dueDate)}
            </div>
          )}
          {lending.repaymentType === 'installment' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-transparent text-muted-foreground">
              <Clock size={10} />
              📅 {fmt(lending.monthlyAmount ?? 0)} / month · due {lending.monthlyDueDay}th
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!isSettled && (
            <Button size="sm" onClick={onRecord} className="gap-1.5 h-8">
              <IndianRupee size={13} /> Record Payment
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => copyReminder(lending)} className="gap-1.5 h-8">
            <Copy size={13} /> Copy Reminder
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5 h-8">
            <Edit2 size={13} />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}
            className="gap-1.5 h-8 text-red-500 hover:text-red-600 hover:border-red-300">
            <Trash2 size={13} />
          </Button>
          {payments.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {payments.length} payment{payments.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Payment history */}
        {expanded && payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Payment History</p>
            {[...payments].sort((a, b) => b.date - a.date).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm group">
                <div>
                  <span className="font-medium text-green-500">+{fmt(p.amount)}</span>
                  {p.notes && <span className="text-muted-foreground text-xs ml-2">· {p.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{fmtDate(p.date)}</span>
                  <button
                    onClick={() => onDeletePayment(p.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── LendingsPage ──────────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'settled';

export default function LendingsPage() {
  const { user } = useData();
  const {
    lendings, loaded, addLending, editLending, deleteLending,
    recordPayment, deletePayment, getPaymentsForLending,
    totalOutstanding, totalLent, settledCount, activeCount,
  } = useLendings(user?.id);

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Lending | null>(null);
  const [recordTarget, setRecordTarget] = useState<Lending | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    let list = [...lendings];
    if (filter === 'active') list = list.filter((l) => l.remainingAmount > 0);
    if (filter === 'settled') list = list.filter((l) => l.remainingAmount === 0);
    // Sort: overdue first, then due-soon, then active, then settled
    const order: Record<LendingStatus, number> = { overdue: 0, 'due-soon': 1, active: 2, settled: 3 };
    return list.sort((a, b) => order[getStatus(a)] - order[getStatus(b)]);
  }, [lendings, filter]);

  const deleteTarget = lendings.find((l) => l.id === deleteId);

  if (!loaded) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lendings</h1>
          <p className="text-muted-foreground">Track money you lent to friends &amp; family</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setShowAdd(true); }} className="gap-2">
          <Plus size={18} /> Lend Money
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Lent', value: fmt(totalLent), color: 'text-blue-500', icon: <IndianRupee size={16} /> },
          { label: 'Outstanding', value: fmt(totalOutstanding), color: 'text-red-400', icon: <AlertTriangle size={16} /> },
          { label: 'Active', value: String(activeCount), color: 'text-amber-500', icon: <Users size={16} /> },
          { label: 'Settled', value: String(settledCount), color: 'text-green-500', icon: <CheckCircle2 size={16} /> },
        ].map((s) => (
          <Card key={s.label} className="p-4 border border-border shadow-sm">
            <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-medium">{s.label}</span></div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      {lendings.length > 0 && (
        <div className="flex gap-2">
          {(['all', 'active', 'settled'] as FilterType[]).map((f) => (
            <button key={f} type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}>
              {f === 'all' ? 'All' : f === 'active' ? `Active (${activeCount})` : `Settled (${settledCount})`}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {lendings.length === 0 ? (
        <Card className="p-12 border border-border text-center">
          <Users size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No lendings yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Lend Money" to start tracking money you've given to friends &amp; family.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No {filter} lendings.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((lending) => (
            <LendingCard
              key={lending.id}
              lending={lending}
              payments={getPaymentsForLending(lending.id)}
              onEdit={() => { setEditTarget(lending); setShowAdd(true); }}
              onDelete={() => setDeleteId(lending.id)}
              onRecord={() => setRecordTarget(lending)}
              onDeletePayment={(pid) => deletePayment(pid)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddLendingModal
        open={showAdd}
        onOpenChange={(v) => { setShowAdd(v); if (!v) setEditTarget(null); }}
        editLending={editTarget ?? undefined}
        onSave={(data) => {
          if (editTarget) {
            editLending(editTarget.id, data);
          } else {
            addLending(data);
          }
        }}
      />

      {/* Record Payment Modal */}
      {recordTarget && (
        <RecordPaymentModal
          open={!!recordTarget}
          onOpenChange={(v) => { if (!v) setRecordTarget(null); }}
          lending={recordTarget}
          onRecord={(amount, date, notes) => recordPayment(recordTarget.id, amount, date, notes)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <AlertDialog open onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lending?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove lending to <strong>{deleteTarget?.personName}</strong> (₹{deleteTarget?.originalAmount.toLocaleString('en-IN')})? All payment records will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { deleteLending(deleteId); setDeleteId(null); }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
