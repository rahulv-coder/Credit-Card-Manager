'use client';

import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lending } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lending: Lending;
  onRecord: (amount: number, date: number, notes: string) => void;
}

export default function RecordPaymentModal({ open, onOpenChange, lending, onRecord }: Props) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => { setAmount(''); setDate(new Date().toISOString().split('T')[0]); setNotes(''); setErrors({}); };

  const handleOpenChange = (next: boolean) => { if (!next) reset(); onOpenChange(next); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) e2.amount = 'Enter a valid amount';
    else if (val > lending.remainingAmount) e2.amount = `Cannot exceed remaining ₹${lending.remainingAmount.toLocaleString('en-IN')}`;
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;
    onRecord(val, new Date(date).getTime(), notes.trim());
    handleOpenChange(false);
  };

  const isFullPayment = parseFloat(amount) === lending.remainingAmount;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Recording payment from <strong>{lending.personName}</strong>. Remaining: ₹{lending.remainingAmount.toLocaleString('en-IN')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick-fill full amount */}
          <button
            type="button"
            onClick={() => setAmount(String(lending.remainingAmount))}
            className="w-full p-3 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/25 transition-colors font-medium"
          >
            ✓ Full Settlement — ₹{lending.remainingAmount.toLocaleString('en-IN')}
          </button>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Amount Received (₹) *</Label>
              {isFullPayment && parseFloat(amount) > 0 && (
                <span className="text-xs text-green-500 font-medium">Full settlement ✓</span>
              )}
            </div>
            <Input type="number" placeholder="0" min="1" max={lending.remainingAmount} value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={errors.amount ? 'border-destructive' : ''} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date Received</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Cash, UPI transfer" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!amount || parseFloat(amount) <= 0}>
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
