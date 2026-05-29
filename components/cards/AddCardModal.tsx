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
import { CARD_COLORS, CARD_ISSUERS } from '@/lib/constants/categories';

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCardModal({ open, onOpenChange }: AddCardModalProps) {
  const { addCard } = useData();
  const [formData, setFormData] = useState({
    name: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    issuer: 'HDFC',
    creditLimit: '',
    color: CARD_COLORS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.cardNumber || !formData.cardHolder || !formData.expiryDate || !formData.creditLimit) {
      alert('Please fill all fields');
      return;
    }

    addCard({
      name: formData.name,
      cardNumber: formData.cardNumber,
      cardHolder: formData.cardHolder,
      expiryDate: formData.expiryDate,
      issuer: formData.issuer,
      creditLimit: parseInt(formData.creditLimit),
      currentBalance: 0,
      color: formData.color,
    });

    setFormData({
      name: '',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      issuer: 'HDFC',
      creditLimit: '',
      color: CARD_COLORS[0],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>Add a new credit card to track your spending</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Card Name</Label>
            <Input
              id="name"
              placeholder="e.g., Primary HDFC Card"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9101 1121"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="cardHolder">Cardholder Name</Label>
            <Input
              id="cardHolder"
              placeholder="John Doe"
              value={formData.cardHolder}
              onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date (MM/YY)</Label>
              <Input
                id="expiryDate"
                placeholder="12/25"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="issuer">Issuer</Label>
              <Select value={formData.issuer} onValueChange={(value) => setFormData({ ...formData, issuer: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_ISSUERS.map((issuer) => (
                    <SelectItem key={issuer} value={issuer}>
                      {issuer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="creditLimit">Credit Limit</Label>
            <Input
              id="creditLimit"
              type="number"
              placeholder="500000"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
            />
          </div>

          <div>
            <Label>Card Color</Label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-foreground ring-2 ring-offset-2' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
