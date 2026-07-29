'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SplitGroup, SplitGroupMember, SplitExpense,
  SplitExpenseSplit, SplitSettlement,
} from '@/lib/types';
import { useSplitGroups, calcBalances } from '@/hooks/use-split-groups';
import AddExpenseModal from './AddExpenseModal';
import SettleUpModal from './SettleUpModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Copy, Check, Trash2, LogOut, Users, ArrowRightLeft,
  ChevronDown, ChevronUp, Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Expense Row ───────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  splits,
  myMemberId,
  canDelete,
  onDelete,
}: {
  expense: SplitExpense;
  splits: SplitExpenseSplit[];
  myMemberId: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const mySplit = splits.find((s) => s.memberId === myMemberId);
  const isPayer = expense.paidByMemberId === myMemberId;

  return (
    <div className="group bg-secondary hover:bg-accent/40 rounded-lg p-3.5 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Receipt size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{expense.description}</p>
              <p className="text-xs text-muted-foreground">
                {expense.paidByName} paid · {expense.category} · {fmtDate(expense.date)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm text-foreground">{fmt(expense.amount)}</p>
              {mySplit && !isPayer && (
                <p className="text-xs text-red-400">you owe {fmt(mySplit.amount)}</p>
              )}
              {isPayer && (
                <p className="text-xs text-green-500">you paid</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {splits.length} split{splits.length !== 1 ? 's' : ''}
            </button>
            {canDelete && (
              <button type="button" onClick={onDelete}
                className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all">
                <Trash2 size={13} className="text-red-400" />
              </button>
            )}
          </div>
          {expanded && (
            <div className="mt-2 space-y-1 pl-1">
              {splits.map((s) => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span className={`text-foreground ${s.memberId === myMemberId ? 'font-medium' : ''}`}>
                    {s.memberName}{s.memberId === myMemberId ? ' (you)' : ''}
                  </span>
                  <span className={s.memberId === expense.paidByMemberId ? 'text-green-500' : 'text-muted-foreground'}>
                    {fmt(s.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── GroupDetailPage ────────────────────────────────────────────────────────────

interface Props { groupId: string; }

export default function GroupDetailPage({ groupId }: Props) {
  const router = useRouter();
  const {
    getGroupData, addExpense, deleteExpense, addSettlement, leaveGroup, deleteGroup,
    myMemberId, currentUserId,
  } = useSplitGroups();

  const [group, setGroup] = useState<SplitGroup | null>(null);
  const [members, setMembers] = useState<SplitGroupMember[]>([]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [splits, setSplits] = useState<SplitExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<SplitSettlement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements'>('balances');

  const load = useCallback(async () => {
    setDataLoading(true);
    const d = await getGroupData(groupId);
    setGroup(d.group); setMembers(d.members); setExpenses(d.expenses);
    setSplits(d.splits); setSettlements(d.settlements);
    setDataLoading(false);
  }, [groupId, getGroupData]);

  useEffect(() => { load(); }, [load]);

  const myId = useMemo(() => myMemberId(groupId, members), [groupId, members, myMemberId]);
  const balances = useMemo(() => calcBalances(members, expenses, splits, settlements), [members, expenses, splits, settlements]);

  const myBalance = balances.find((b) => b.memberId === myId);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handleLeave = async () => {
    setLeaving(true);
    const res = await leaveGroup(groupId);
    setLeaving(false);
    if (res.error) { toast.error(res.error); }
    else { toast.success('You left the group'); router.push('/groups'); }
    setShowLeaveConfirm(false);
  };

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    const res = await deleteGroup(groupId);
    setDeletingGroup(false);
    if (res.error) { toast.error(res.error); }
    else { toast.success('Group deleted'); router.push('/groups'); }
    setShowDeleteGroupConfirm(false);
  };

  const handleAddExpense = async (
    paidByMemberId: string, paidByName: string, description: string,
    amount: number, category: string, date: number,
    splitList: { memberId: string; memberName: string; amount: number }[]
  ) => {
    const result = await addExpense(groupId, paidByMemberId, paidByName, description, amount, category, date, splitList);
    if (!result.error) load();
    return result;
  };

  const handleSettle = async (
    fromMemberId: string, fromName: string, toMemberId: string, toName: string,
    amount: number, date: number, notes: string
  ) => {
    await addSettlement(groupId, fromMemberId, fromName, toMemberId, toName, amount, date, notes);
    load();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId, groupId);
    setDeleteExpenseId(null);
    load();
  };

  if (dataLoading) return <div className="p-6 text-muted-foreground animate-pulse">Loading group…</div>;
  if (!group) return <div className="p-6 text-destructive">Group not found or you are not a member.</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/groups')} className="text-muted-foreground hover:text-foreground text-sm">
              ← Groups
            </button>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
          {group.description && <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={copyCode} className="gap-1.5">
            {codeCopied ? <Check size={14} /> : <Copy size={14} />}
            {codeCopied ? 'Copied!' : group.inviteCode}
          </Button>
          {group.createdBy === currentUserId ? (
            <Button size="sm" variant="outline"
              onClick={() => setShowDeleteGroupConfirm(true)}
              className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300">
              <Trash2 size={14} /> Delete
            </Button>
          ) : (
            <Button size="sm" variant="outline"
              onClick={() => setShowLeaveConfirm(true)}
              className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300">
              <LogOut size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* My balance banner */}
      {myBalance && (
        <div className={`p-4 rounded-xl border ${
          myBalance.netBalance > 0
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
            : myBalance.netBalance < 0
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            : 'bg-secondary border-transparent'
        }`}>
          <p className="text-xs text-muted-foreground mb-0.5">Your balance</p>
          <p className={`text-2xl font-bold ${
            myBalance.netBalance > 0 ? 'text-green-600 dark:text-green-400'
            : myBalance.netBalance < 0 ? 'text-red-500'
            : 'text-foreground'
          }`}>
            {myBalance.netBalance > 0
              ? `+${fmt(myBalance.netBalance)} — others owe you`
              : myBalance.netBalance < 0
              ? `-${fmt(myBalance.netBalance)} — you owe`
              : 'All settled up ✓'}
          </p>
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-2">
        <Button onClick={() => setShowAddExpense(true)} className="gap-2 flex-1">
          <Plus size={16} /> Add Expense
        </Button>
        <Button variant="outline" onClick={() => setShowSettle(true)} className="gap-2">
          <ArrowRightLeft size={16} /> Settle Up
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Expenses', value: fmt(totalExpenses), color: 'text-foreground' },
          { label: 'Members', value: String(members.length), color: 'text-blue-500' },
          { label: 'Transactions', value: String(expenses.length + settlements.length), color: 'text-purple-500' },
        ].map((s) => (
          <Card key={s.label} className="p-3 border border-border text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        {(['balances', 'expenses', 'settlements'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Balances tab ── */}
      {activeTab === 'balances' && (
        <div className="space-y-2">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Add some expenses to see balances.</p>
          ) : (
            balances.map((b) => (
              <div key={b.memberId} className="flex items-center justify-between p-3.5 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                    {b.memberName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {b.memberName}{b.userId === currentUserId ? ' (you)' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.netBalance === 0 ? 'All settled' : b.netBalance > 0 ? 'Gets back' : 'Owes'}
                    </p>
                  </div>
                </div>
                <span className={`text-base font-bold ${
                  b.netBalance > 0 ? 'text-green-500' : b.netBalance < 0 ? 'text-red-400' : 'text-muted-foreground'
                }`}>
                  {b.netBalance === 0 ? '✓' : b.netBalance > 0 ? `+${fmt(b.netBalance)}` : `-${fmt(b.netBalance)}`}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Expenses tab ── */}
      {activeTab === 'expenses' && (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No expenses yet. Add the first one!</p>
          ) : (
            expenses.map((exp) => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                splits={splits.filter((s) => s.expenseId === exp.id)}
                myMemberId={myId ?? ''}
                canDelete={exp.paidByMemberId === myId}
                onDelete={() => setDeleteExpenseId(exp.id)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Settlements tab ── */}
      {activeTab === 'settlements' && (
        <div className="space-y-2">
          {settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No settlements yet.</p>
          ) : (
            settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3.5 bg-secondary rounded-lg text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    <span className="text-blue-500">{s.fromName}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className="text-green-500">{s.toName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtDate(s.date)}{s.notes ? ` · ${s.notes}` : ''}</p>
                </div>
                <span className="font-bold text-green-500">{fmt(s.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Members list (always visible at bottom) */}
      <Card className="p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{members.length} Members</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-full text-xs">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {m.displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-foreground">{m.displayName}</span>
              {m.role === 'admin' && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Admin</Badge>}
              {m.userId === currentUserId && <span className="text-muted-foreground">(you)</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Modals */}
      {myId && (
        <>
          <AddExpenseModal
            open={showAddExpense}
            onOpenChange={setShowAddExpense}
            members={members}
            myMemberId={myId}
            onAdd={handleAddExpense}
          />
          <SettleUpModal
            open={showSettle}
            onOpenChange={setShowSettle}
            members={members}
            balances={balances}
            myMemberId={myId}
            onSettle={handleSettle}
          />
        </>
      )}

      {/* Delete expense */}
      {deleteExpenseId && (
        <AlertDialog open onOpenChange={(v) => { if (!v) setDeleteExpenseId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>This will remove the expense and all its splits. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteExpense(deleteExpenseId)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Leave group */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer see this group. You <strong>cannot leave</strong> if you have unsettled expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={leaving} className="bg-red-600 hover:bg-red-700 text-white">
              {leaving ? 'Leaving…' : 'Leave Group'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete group (creator only) */}
      <AlertDialog open={showDeleteGroupConfirm} onOpenChange={setShowDeleteGroupConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{group?.name}</strong> along with all expenses, splits, and settlements. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} disabled={deletingGroup} className="bg-red-600 hover:bg-red-700 text-white">
              {deletingGroup ? 'Deleting…' : 'Delete Group'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
