'use client';

import React, { useState } from 'react';
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
import { TRANSACTION_CATEGORIES } from '@/lib/constants/categories';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
}

export default function AddTransactionModal({
  open,
  onOpenChange,
  cardId,
}: AddTransactionModalProps) {
  const { addTransaction } = useData();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      alert('Please fill all fields');
      return;
    }

    addTransaction({
      cardId,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date(formData.date).getTime(),
      type: 'debit',
    });

    setFormData({
      amount: '',
      description: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new expense on this card</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="1500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Coffee at Starbucks"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

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

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
