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
import { CARD_COLORS, CARD_ISSUERS } from '@/lib/constants/categories';
import {
  formatCardNumber,
  validateCardNumber,
  formatExpiryDate,
  validateExpiryDate,
  validateCardholderName,
  validateAmount,
} from '@/lib/utils/validation';

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
    issuer: 'HDFC Bank',
    customBankName: '',
    creditLimit: '',
    color: CARD_COLORS[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Card name is required';
    }

    if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Card number must be exactly 16 digits';
    }

    if (!validateCardholderName(formData.cardHolder)) {
      newErrors.cardHolder = 'Cardholder name must contain at least 2 characters (letters only)';
    }

    if (!validateExpiryDate(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date (use MM/YY format, month 01-12)';
    }

    if (formData.issuer === 'Other' && !formData.customBankName.trim()) {
      newErrors.customBankName = 'Please enter the bank name';
    }

    if (!validateAmount(formData.creditLimit) || parseInt(formData.creditLimit) <= 0) {
      newErrors.creditLimit = 'Credit limit must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      validateCardNumber(formData.cardNumber) &&
      validateCardholderName(formData.cardHolder) &&
      validateExpiryDate(formData.expiryDate) &&
      (formData.issuer !== 'Other' || formData.customBankName.trim() !== '') &&
      validateAmount(formData.creditLimit) &&
      parseInt(formData.creditLimit) > 0
    );
  }, [formData]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData({ ...formData, cardNumber: formatted });
    if (errors.cardNumber) {
      setErrors({ ...errors, cardNumber: '' });
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setFormData({ ...formData, expiryDate: formatted });
      if (errors.expiryDate) {
        setErrors({ ...errors, expiryDate: '' });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const issuerName = formData.issuer === 'Other' ? formData.customBankName : formData.issuer;

    addCard({
      name: formData.name,
      cardNumber: formData.cardNumber,
      cardHolder: formData.cardHolder,
      expiryDate: formData.expiryDate,
      issuer: formData.issuer === 'Other' ? 'Other' : formData.issuer,
      customBankName: formData.issuer === 'Other' ? formData.customBankName : undefined,
      creditLimit: parseInt(formData.creditLimit),
      currentBalance: 0,
      color: formData.color,
    });

    setFormData({
      name: '',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      issuer: 'HDFC Bank',
      customBankName: '',
      creditLimit: '',
      color: CARD_COLORS[0],
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>Add a new credit card to track your spending. All fields are required.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Name */}
          <div>
            <Label htmlFor="name">Card Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Primary HDFC Card"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Card Number (16 digits) *</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9101 1121"
              maxLength={19}
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              className={errors.cardNumber ? 'border-destructive' : ''}
            />
            {errors.cardNumber ? (
              <p className="text-xs text-destructive mt-1">{errors.cardNumber}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.cardNumber.replace(/\s/g, '').length}/16 digits
              </p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardHolder">Cardholder Name *</Label>
            <Input
              id="cardHolder"
              placeholder="John Doe"
              value={formData.cardHolder}
              onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
              className={errors.cardHolder ? 'border-destructive' : ''}
            />
            {errors.cardHolder && <p className="text-xs text-destructive mt-1">{errors.cardHolder}</p>}
          </div>

          {/* Expiry Date and Issuer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Valid Till (MM/YY) *</Label>
              <Input
                id="expiryDate"
                placeholder="12/25"
                maxLength={5}
                value={formData.expiryDate}
                onChange={handleExpiryDateChange}
                className={errors.expiryDate ? 'border-destructive' : ''}
              />
              {errors.expiryDate ? (
                <p className="text-xs text-destructive mt-1">{errors.expiryDate}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Month: 01-12</p>
              )}
            </div>
            <div>
              <Label htmlFor="issuer">Issuer *</Label>
              <Select 
                value={formData.issuer} 
                onValueChange={(value) => {
                  setFormData({ ...formData, issuer: value, customBankName: '' });
                  if (errors.issuer) {
                    setErrors({ ...errors, issuer: '' });
                  }
                }}
              >
                <SelectTrigger className={errors.issuer ? 'border-destructive' : ''}>
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
              {errors.issuer && <p className="text-xs text-destructive mt-1">{errors.issuer}</p>}
            </div>
          </div>

          {/* Custom Bank Name (if Other selected) */}
          {formData.issuer === 'Other' && (
            <div>
              <Label htmlFor="customBankName">Bank Name *</Label>
              <Input
                id="customBankName"
                placeholder="Enter your bank name"
                value={formData.customBankName}
                onChange={(e) => {
                  setFormData({ ...formData, customBankName: e.target.value });
                  if (errors.customBankName) {
                    setErrors({ ...errors, customBankName: '' });
                  }
                }}
                className={errors.customBankName ? 'border-destructive' : ''}
              />
              {errors.customBankName && <p className="text-xs text-destructive mt-1">{errors.customBankName}</p>}
            </div>
          )}

          {/* Credit Limit */}
          <div>
            <Label htmlFor="creditLimit">Credit Limit *</Label>
            <Input
              id="creditLimit"
              type="number"
              placeholder="500000"
              value={formData.creditLimit}
              onChange={(e) => {
                setFormData({ ...formData, creditLimit: e.target.value });
                if (errors.creditLimit) {
                  setErrors({ ...errors, creditLimit: '' });
                }
              }}
              className={errors.creditLimit ? 'border-destructive' : ''}
            />
            {errors.creditLimit && <p className="text-xs text-destructive mt-1">{errors.creditLimit}</p>}
          </div>

          {/* Card Color */}
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
                  title="Select color"
                />
              ))}
            </div>
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
              Add Card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
