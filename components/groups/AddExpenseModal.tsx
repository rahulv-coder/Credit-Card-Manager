'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SplitGroupMember } from '@/lib/types';
import { DEBIT_CATEGORIES } from '@/lib/constants/categories';
import { IndianRupee, Users } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: SplitGroupMember[];
  myMemberId: string;
  onAdd: (
    paidByMemberId: string,
    paidByName: string,
    description: string,
    amount: number,
    category: string,
    date: number,
    splits: { memberId: string; memberName: string; amount: number }[]
  ) => Promise<{ error?: string }>;
}

export default function AddExpenseModal({ open, onOpenChange, members, myMemberId, onAdd }: Props) {
  const getInitial = () => ({
    paidBy: myMemberId,
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal' as 'equal' | 'custom',
    customAmounts: {} as Record<string, string>,
    includedMembers: members.map((m) => m.id),
  });

  const [form, setForm] = useState(getInitial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setForm(getInitial()); setError(''); }, [open, members, myMemberId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const totalAmount = parseFloat(form.amount) || 0;
  const includedCount = form.includedMembers.length;

  // Compute splits
  const computedSplits = useMemo(() => {
    if (totalAmount <= 0 || includedCount === 0) return [];
    if (form.splitType === 'equal') {
      const each = Math.round((totalAmount / includedCount) * 100) / 100;
      const remainder = Math.round((totalAmount - each * includedCount) * 100) / 100;
      return form.includedMembers.map((id, i) => {
        const m = members.find((x) => x.id === id)!;
        return { memberId: id, memberName: m.displayName, amount: each + (i === 0 ? remainder : 0) };
      });
    }
    // custom
    return form.includedMembers.map((id) => {
      const m = members.find((x) => x.id === id)!;
      return { memberId: id, memberName: m.displayName, amount: parseFloat(form.customAmounts[id] || '0') || 0 };
    });
  }, [form.splitType, form.includedMembers, form.customAmounts, totalAmount, includedCount, members]);

  const customTotal = computedSplits.reduce((s, x) => s + x.amount, 0);
  const customRemainder = Math.round((totalAmount - customTotal) * 100) / 100;

  const isValid = useMemo(() => {
    if (!form.description.trim() || totalAmount <= 0 || includedCount === 0) return false;
    if (form.splitType === 'custom' && Math.abs(customRemainder) > 0.01) return false;
    return true;
  }, [form, totalAmount, includedCount, customRemainder]);

  const paidByMember = members.find((m) => m.id === form.paidBy);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !paidByMember) return;
    setSaving(true); setError('');
    const result = await onAdd(
      form.paidBy, paidByMember.displayName,
      form.description.trim(), totalAmount, form.category,
      new Date(form.date).getTime(), computedSplits
    );
    setSaving(false);
    if (result.error) { setError(result.error); }
    else onOpenChange(false);
  };

  const toggleMember = (id: string) => {
    setForm((f) => ({
      ...f,
      includedMembers: f.includedMembers.includes(id)
        ? f.includedMembers.filter((x) => x !== id)
        : [...f.includedMembers, id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record a shared expense and split it among group members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input placeholder="e.g. Hotel booking, Dinner at restaurant" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} autoFocus />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Total Amount (₹) *</Label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="number" min="1" step="0.01" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="pl-8" />
            </div>
          </div>

          {/* Paid by */}
          <div className="space-y-1.5">
            <Label>Paid by</Label>
            <Select value={form.paidBy} onValueChange={(v) => setForm((f) => ({ ...f, paidBy: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName}{m.id === myMemberId ? ' (you)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEBIT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
          </div>

          {/* Split type */}
          <div className="space-y-2">
            <Label>Split Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['equal', 'custom'] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, splitType: t }))}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.splitType === t ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'
                  }`}>
                  {t === 'equal' ? '⚖️ Split Equally' : '✏️ Custom Amounts'}
                </button>
              ))}
            </div>
          </div>

          {/* Members to include */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users size={14} /> Split Among ({includedCount} members)
            </Label>
            <div className="space-y-1.5">
              {members.map((m) => {
                const included = form.includedMembers.includes(m.id);
                const splitAmt = computedSplits.find((s) => s.memberId === m.id)?.amount ?? 0;
                return (
                  <div key={m.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    included ? 'bg-primary/5 border-primary/30' : 'bg-secondary border-transparent opacity-50'
                  }`}>
                    <button type="button" onClick={() => toggleMember(m.id)}
                      className="flex items-center gap-2 flex-1">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        included ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {included && <span className="text-primary-foreground text-xs">✓</span>}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {m.displayName}{m.id === myMemberId ? ' (you)' : ''}
                      </span>
                    </button>
                    {included && totalAmount > 0 && (
                      form.splitType === 'equal' ? (
                        <span className="text-sm font-semibold text-primary">₹{splitAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      ) : (
                        <Input
                          type="number" min="0" step="0.01"
                          value={form.customAmounts[m.id] || ''}
                          onChange={(e) => setForm((f) => ({ ...f, customAmounts: { ...f.customAmounts, [m.id]: e.target.value } }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-24 h-7 text-sm text-right"
                          placeholder="0"
                        />
                      )
                    )}
                  </div>
                );
              })}
            </div>
            {form.splitType === 'custom' && totalAmount > 0 && (
              <div className={`text-xs text-right font-medium ${Math.abs(customRemainder) > 0.01 ? 'text-red-500' : 'text-green-500'}`}>
                {Math.abs(customRemainder) > 0.01
                  ? `₹${customRemainder.toFixed(2)} unallocated`
                  : '✓ Amounts add up correctly'}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!isValid || saving}>
              {saving ? 'Adding…' : `Add Expense — ₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
