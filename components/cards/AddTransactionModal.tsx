'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/lib/context/DataContext';
import { Transaction, Card } from '@/lib/types';
import { DEBIT_CATEGORIES, CREDIT_CATEGORIES } from '@/lib/constants/categories';
import { validateAmount } from '@/lib/utils/validation';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId?: string;
  editTransaction?: Transaction;
}

export default function AddTransactionModal({
  open,
  onOpenChange,
  cardId: defaultCardId,
  editTransaction,
}: AddTransactionModalProps) {
  const { cards, addTransaction, updateTransaction } = useData();
  const isEdit = !!editTransaction;

  const getInitialFormData = () => ({
    cardId: editTransaction?.cardId || defaultCardId || '',
    amount: editTransaction ? String(editTransaction.amount) : '',
    description: editTransaction?.description || '',
    category: editTransaction?.category || 'Food',
    date: editTransaction
      ? new Date(editTransaction.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    type: (editTransaction?.type || 'debit') as 'debit' | 'credit',
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(getInitialFormData());
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTransaction, open]);

  const categories = formData.type === 'debit' ? DEBIT_CATEGORIES : CREDIT_CATEGORIES;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) { setFormData(getInitialFormData()); setErrors({}); }
    onOpenChange(nextOpen);
  };

  const selectedCard = useMemo(
    () => cards.find((c: Card) => c.id === formData.cardId),
    [formData.cardId, cards]
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.cardId) newErrors.cardId = 'Please select a card';
    if (!validateAmount(formData.amount)) newErrors.amount = 'Amount must be a positive number';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = useMemo(
    () => formData.cardId !== '' && validateAmount(formData.amount) && formData.description.trim() !== '',
    [formData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      cardId: formData.cardId,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date(formData.date).getTime(),
      type: formData.type,
    };
    if (isEdit && editTransaction) {
      await updateTransaction(editTransaction.id, payload);
    } else {
      await addTransaction(payload);
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the transaction details.' : 'Record a new transaction.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debit / Credit toggle */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => setFormData({ ...formData, type: 'debit', category: 'Food' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                  formData.type === 'debit' ? 'bg-red-500 border-red-500 text-white' : 'border-border text-muted-foreground hover:border-red-400'
                }`}>
                <ArrowDownCircle size={15} /> Debit / Expense
              </button>
              <button type="button"
                onClick={() => setFormData({ ...formData, type: 'credit', category: 'Income' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                  formData.type === 'credit' ? 'bg-green-500 border-green-500 text-white' : 'border-border text-muted-foreground hover:border-green-400'
                }`}>
                <ArrowUpCircle size={15} /> Credit / Income
              </button>
            </div>
          </div>

          {/* Card selector */}
          <div className="space-y-2">
            <Label>Card *</Label>
            <Select value={formData.cardId} onValueChange={(v) => setFormData({ ...formData, cardId: v })}>
              <SelectTrigger className={errors.cardId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a card" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card: Card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} ({card.issuer}{card.customBankName ? ` - ${card.customBankName}` : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cardId && <p className="text-xs text-destructive">{errors.cardId}</p>}
          </div>

          {selectedCard && (
            <div className="bg-secondary rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit Limit</span>
                <span className="font-semibold">â‚¹{selectedCard.creditLimit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-medium">â‚¹{selectedCard.currentBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input type="number" step="0.01" placeholder="1500" value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={errors.amount ? 'border-destructive' : ''} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input placeholder={formData.type === 'credit' ? 'e.g., Monthly Salary' : 'e.g., Coffee at Starbucks'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? 'border-destructive' : ''} />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={!isFormValid}>
              {isEdit ? 'Save Changes' : formData.type === 'credit' ? 'Add Credit' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

