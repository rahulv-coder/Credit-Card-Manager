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
import { Lending, LendingRepaymentType } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lending: Omit<Lending, 'id' | 'createdAt' | 'remainingAmount'>) => void;
  editLending?: Lending;
}

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function AddLendingModal({ open, onOpenChange, onSave, editLending }: Props) {
  const isEdit = !!editLending;

  const getInitial = () => ({
    personName: editLending?.personName || '',
    phone: editLending?.phone || '',
    purpose: editLending?.purpose || '',
    originalAmount: editLending ? String(editLending.originalAmount) : '',
    lentDate: editLending
      ? new Date(editLending.lentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    dueDate: editLending?.dueDate
      ? new Date(editLending.dueDate).toISOString().split('T')[0]
      : '',
    repaymentType: (editLending?.repaymentType || 'full') as LendingRepaymentType,
    monthlyAmount: editLending?.monthlyAmount ? String(editLending.monthlyAmount) : '',
    monthlyDueDay: editLending?.monthlyDueDay ? String(editLending.monthlyDueDay) : '1',
    notes: editLending?.notes || '',
  });

  const [form, setForm] = useState(getInitial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(getInitial());
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLending, open]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.personName.trim()) e.personName = 'Name is required';
    const amt = parseFloat(form.originalAmount);
    if (isNaN(amt) || amt <= 0) e.originalAmount = 'Enter a valid amount';
    if (form.repaymentType === 'installment') {
      const ma = parseFloat(form.monthlyAmount);
      if (isNaN(ma) || ma <= 0) e.monthlyAmount = 'Enter expected monthly amount';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = useMemo(() => {
    if (!form.personName.trim()) return false;
    if (!form.originalAmount || isNaN(parseFloat(form.originalAmount)) || parseFloat(form.originalAmount) <= 0) return false;
    if (form.repaymentType === 'installment') {
      if (!form.monthlyAmount || isNaN(parseFloat(form.monthlyAmount)) || parseFloat(form.monthlyAmount) <= 0) return false;
    }
    return true;
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      personName: form.personName.trim(),
      phone: form.phone.trim(),
      purpose: form.purpose.trim(),
      originalAmount: parseFloat(form.originalAmount),
      lentDate: new Date(form.lentDate).getTime(),
      dueDate: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
      repaymentType: form.repaymentType,
      monthlyAmount: form.repaymentType === 'installment' ? parseFloat(form.monthlyAmount) : undefined,
      monthlyDueDay: form.repaymentType === 'installment' ? parseInt(form.monthlyDueDay) : undefined,
      notes: form.notes.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Lending' : 'Lend Money'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the lending details.' : 'Record money you are lending to someone.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Person name */}
          <div className="space-y-1.5">
            <Label>Person Name *</Label>
            <Input placeholder="e.g. Rahul Sharma" value={form.personName}
              onChange={(e) => set('personName', e.target.value)}
              className={errors.personName ? 'border-destructive' : ''} />
            {errors.personName && <p className="text-xs text-destructive">{errors.personName}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>Phone / Contact <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="+91 9876543210" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Amount (₹) *</Label>
            <Input type="number" placeholder="5000" min="1" value={form.originalAmount}
              onChange={(e) => set('originalAmount', e.target.value)}
              className={errors.originalAmount ? 'border-destructive' : ''} />
            {errors.originalAmount && <p className="text-xs text-destructive">{errors.originalAmount}</p>}
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label>Purpose <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Medical emergency, Travel expense" value={form.purpose}
              onChange={(e) => set('purpose', e.target.value)} />
          </div>

          {/* Lent date */}
          <div className="space-y-1.5">
            <Label>Date Lent</Label>
            <Input type="date" value={form.lentDate} onChange={(e) => set('lentDate', e.target.value)} />
          </div>

          {/* Repayment type */}
          <div className="space-y-1.5">
            <Label>Repayment Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['full', 'installment'] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => set('repaymentType', t)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.repaymentType === t
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}>
                  {t === 'full' ? '💰 Full Payment' : '📅 Monthly Instalments'}
                </button>
              ))}
            </div>
          </div>

          {/* Due date (full) */}
          {form.repaymentType === 'full' && (
            <div className="space-y-1.5">
              <Label>Expected Return Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          )}

          {/* Instalment details */}
          {form.repaymentType === 'installment' && (
            <div className="space-y-3 p-3 bg-secondary rounded-lg">
              <div className="space-y-1.5">
                <Label>Expected Monthly Amount (₹) *</Label>
                <Input type="number" placeholder="1000" min="1" value={form.monthlyAmount}
                  onChange={(e) => set('monthlyAmount', e.target.value)}
                  className={errors.monthlyAmount ? 'border-destructive' : ''} />
                {errors.monthlyAmount && <p className="text-xs text-destructive">{errors.monthlyAmount}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Due Day of Month</Label>
                <Select value={form.monthlyDueDay} onValueChange={(v) => set('monthlyDueDay', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="Any additional notes…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!isValid}>
              {isEdit ? 'Save Changes' : 'Record Lending'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
