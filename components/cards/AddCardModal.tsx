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
import {
  formatCardNumber,
  validateCardNumber,
  formatExpiryDate,
  validateExpiryDate,
  validateCardholderName,
  validateAmount,
} from '@/lib/utils/validation';

import type { Card } from '@/lib/types';

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCard?: Card | null;
}

export default function AddCardModal({ open, onOpenChange, initialCard = null }: AddCardModalProps) {
  const { addCard, updateCard } = useData();
  const getInitialFormData = () => ({
    name: initialCard ? initialCard.name : '',
    cardNumber: initialCard ? initialCard.cardNumber : '',
    cardHolder: initialCard ? initialCard.cardHolder : '',
    expiryDate: initialCard ? initialCard.expiryDate : '',
    issuer: initialCard ? initialCard.issuer : '',
    customBankName: initialCard ? initialCard.customBankName ?? '' : '',
    creditLimit: initialCard ? String(initialCard.creditLimit) : '',
    billingCycleDay: initialCard ? String(initialCard.billingCycleDay) : '1',
    paymentDueDays: initialCard ? String(initialCard.paymentDueDays) : '20',
    color: initialCard ? initialCard.color : CARD_COLORS[0],
  });

  const [formData, setFormData] = useState(getInitialFormData);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData(getInitialFormData());
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  React.useEffect(() => {
    // when initialCard or open changes, reset form to reflect initialCard
    setFormData(getInitialFormData());
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCard, open]);

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

    if (!formData.issuer) {
      newErrors.issuer = 'Please select an issuer';
    }

    if (!validateAmount(formData.creditLimit) || parseInt(formData.creditLimit) <= 0) {
      newErrors.creditLimit = 'Credit limit must be a positive number';
    }

    const billingDay = parseInt(formData.billingCycleDay);
    if (isNaN(billingDay) || billingDay < 1 || billingDay > 31) {
      newErrors.billingCycleDay = 'Billing cycle day must be between 1 and 31';
    }

    const paymentDays = parseInt(formData.paymentDueDays);
    if (isNaN(paymentDays) || paymentDays < 1 || paymentDays > 60) {
      newErrors.paymentDueDays = 'Payment due days must be between 1 and 60';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name,
      cardNumber: formData.cardNumber,
      cardHolder: formData.cardHolder,
      expiryDate: formData.expiryDate,
      issuer: formData.issuer === 'Other' ? 'Other' : formData.issuer,
      customBankName: formData.issuer === 'Other' ? formData.customBankName : undefined,
      creditLimit: parseInt(formData.creditLimit),
      currentBalance: initialCard ? initialCard.currentBalance : 0,
      color: formData.color,
      billingCycleDay: parseInt(formData.billingCycleDay),
      paymentDueDays: parseInt(formData.paymentDueDays),
    };

    if (initialCard) {
      await updateCard(initialCard.id, payload);
    } else {
      await addCard(payload);
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>Add a new credit card to track your spending. All fields are required.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Card Name *</Label>
            <Input
              id="name"
              placeholder="Name of the Card"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number (16 digits) *</Label>
            <Input
              id="cardNumber"
              placeholder="XXXX  XXXX  XXXX  XXXX"
              maxLength={19}
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              disabled={!!initialCard}
              className={`tracking-[0.5em] ${errors.cardNumber ? 'border-destructive' : ''}`}
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
          <div className="space-y-2">
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

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Valid Till (MM/YY) *</Label>
            <Input
              id="expiryDate"
              placeholder="12/25"
              maxLength={5}
              value={formData.expiryDate}
              onChange={handleExpiryDateChange}
              disabled={!!initialCard}
              className={errors.expiryDate ? 'border-destructive' : ''}
            />
            {errors.expiryDate ? (
              <p className="text-xs text-destructive mt-1">{errors.expiryDate}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Month: 01-12</p>
            )}
          </div>

          {/* Issuer */}
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer *</Label>
            <Select
              value={formData.issuer}
              onValueChange={(value) => {
                if (initialCard) return; // don't allow changing issuer when editing
                setFormData({ ...formData, issuer: value, customBankName: '' });
                if (errors.issuer) setErrors({ ...errors, issuer: '' });
              }}
            >
              <SelectTrigger className={`w-full ${errors.issuer ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select a bank" />
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

          {/* Custom Bank Name (if Other selected) */}
          {formData.issuer === 'Other' && (
            <div className="space-y-2">
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
          <div className="space-y-2">
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

          {/* Billing Cycle Day */}
          <div className="space-y-2">
            <Label htmlFor="billingCycleDay">Billing Cycle Day *</Label>
            <Input
              id="billingCycleDay"
              type="number"
              min="1"
              max="31"
              placeholder="1"
              value={formData.billingCycleDay}
              onChange={(e) => {
                setFormData({ ...formData, billingCycleDay: e.target.value });
                if (errors.billingCycleDay) {
                  setErrors({ ...errors, billingCycleDay: '' });
                }
              }}
              className={errors.billingCycleDay ? 'border-destructive' : ''}
            />
            {errors.billingCycleDay ? (
              <p className="text-xs text-destructive mt-1">{errors.billingCycleDay}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Day of month (1-31) when your billing cycle starts</p>
            )}
          </div>

          {/* Due Payment Balance */}
          <div className="space-y-2">
            <Label htmlFor="paymentDueDays">Payment Due Days *</Label>
            <Input
              id="paymentDueDays"
              type="number"
              min="1"
              max="60"
              placeholder="20"
              value={formData.paymentDueDays}
              onChange={(e) => {
                setFormData({ ...formData, paymentDueDays: e.target.value });
                if (errors.paymentDueDays) {
                  setErrors({ ...errors, paymentDueDays: '' });
                }
              }}
              className={errors.paymentDueDays ? 'border-destructive' : ''}
            />
            {errors.paymentDueDays ? (
              <p className="text-xs text-destructive mt-1">{errors.paymentDueDays}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Number of days from billing cycle to pay your bill (1-60)</p>
            )}
          </div>

          {/* Card Color */}
          <div className="space-y-2">
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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
