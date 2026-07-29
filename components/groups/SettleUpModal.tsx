'use client';

import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SplitGroupMember, MemberBalance } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: SplitGroupMember[];
  balances: MemberBalance[];
  myMemberId: string;
  onSettle: (fromMemberId: string, fromName: string, toMemberId: string, toName: string, amount: number, date: number, notes: string) => Promise<void>;
}

export default function SettleUpModal({ open, onOpenChange, members, balances, myMemberId, onSettle }: Props) {
  const [from, setFrom] = useState(myMemberId);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setFrom(myMemberId); setTo(''); setAmount(''); setDate(new Date().toISOString().split('T')[0]); setNotes(''); setSaving(false); };
  const handleOpenChange = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  // Suggest: people who owe negative balance (they owe someone)
  const debtors = balances.filter((b) => b.netBalance < 0);
  const fromMember = members.find((m) => m.id === from);
  const toMember = members.find((m) => m.id === to);

  // Pre-fill amount when selecting to/from
  const fromBalance = balances.find((b) => b.memberId === from);
  const toBalance = balances.find((b) => b.memberId === to);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !amount || from === to) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    await onSettle(from, fromMember?.displayName ?? '', to, toMember?.displayName ?? '', val, new Date(date).getTime(), notes.trim());
    handleOpenChange(false);
  };

  const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle Up</DialogTitle>
          <DialogDescription>Record a payment between two group members.</DialogDescription>
        </DialogHeader>

        {/* Suggested settlements */}
        {debtors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggested Settlements</p>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {debtors.map((d) => {
                // find who they owe most to
                const creditor = balances.filter((b) => b.memberId !== d.memberId).sort((a, b) => b.netBalance - a.netBalance)[0];
                if (!creditor || creditor.netBalance <= 0) return null;
                const suggestAmt = Math.min(Math.abs(d.netBalance), creditor.netBalance);
                return (
                  <button key={d.memberId} type="button"
                    onClick={() => { setFrom(d.memberId); setTo(creditor.memberId); setAmount(suggestAmt.toFixed(2)); }}
                    className="w-full text-left p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-xs hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                    <span className="font-medium text-foreground">{d.memberName}</span>
                    <span className="text-muted-foreground"> owes </span>
                    <span className="font-medium text-foreground">{creditor.memberName}</span>
                    <span className="text-primary font-bold"> {fmt(suggestAmt)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Who is paying */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Who Paid</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}{m.id === myMemberId ? ' (you)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromBalance && (
                <p className={`text-xs ${fromBalance.netBalance < 0 ? 'text-red-400' : 'text-green-500'}`}>
                  Balance: {fromBalance.netBalance < 0 ? `-${fmt(fromBalance.netBalance)}` : `+${fmt(fromBalance.netBalance)}`}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Paid To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {members.filter((m) => m.id !== from).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}{m.id === myMemberId ? ' (you)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {to && toBalance && (
                <p className={`text-xs ${toBalance.netBalance > 0 ? 'text-green-500' : 'text-red-400'}`}>
                  Balance: {toBalance.netBalance < 0 ? `-${fmt(toBalance.netBalance)}` : `+${fmt(toBalance.netBalance)}`}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Amount (₹) *</Label>
            <Input type="number" min="1" step="0.01" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input placeholder="GPay, Cash…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!from || !to || from === to || !amount || saving}>
              {saving ? 'Saving…' : 'Record Settlement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
