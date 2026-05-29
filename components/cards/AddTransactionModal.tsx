'use client';

import React, { useState, useMemo } from 'react';
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
import { Card } from '@/lib/types';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/categories';
import { validateAmount } from '@/lib/utils/validation';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId?: string;
}

export default function AddTransactionModal({
  open,
  onOpenChange,
  cardId: defaultCardId,
}: AddTransactionModalProps) {
  const { cards, addTransaction } = useData();
  const [formData, setFormData] = useState({
    cardId: defaultCardId || '',
    amount: '',
    description: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCard = useMemo(() => {
    return cards.find((card: Card) => card.id === formData.cardId);
  }, [formData.cardId, cards]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardId) {
      newErrors.cardId = 'Please select a card';
    }

    if (!validateAmount(formData.amount)) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = useMemo(() => {
    return (
      formData.cardId !== '' &&
      validateAmount(formData.amount) &&
      formData.description.trim() !== ''
    );
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    addTransaction({
      cardId: formData.cardId,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date(formData.date).getTime(),
      type: 'debit',
    });

    setFormData({
      cardId: defaultCardId || '',
      amount: '',
      description: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new expense. All fields are required.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Which Card I Spent */}
          <div>
            <Label htmlFor="cardId">Which Card I Spent *</Label>
            <Select
              value={formData.cardId}
              onValueChange={(value) => {
                setFormData({ ...formData, cardId: value });
                if (errors.cardId) {
                  setErrors({ ...errors, cardId: '' });
                }
              }}
            >
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
            {errors.cardId && <p className="text-xs text-destructive mt-1">{errors.cardId}</p>}
          </div>

          {/* Credit Limit Display */}
          {selectedCard && (
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available Credit Limit</span>
                <span className="text-lg font-semibold text-foreground">₹{selectedCard.creditLimit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="text-sm font-medium">₹{selectedCard.currentBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="1500"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                if (errors.amount) {
                  setErrors({ ...errors, amount: '' });
                }
              }}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g., Coffee at Starbucks"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              onOpenChange(false);
              setErrors({});
            }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!isFormValid}>
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
