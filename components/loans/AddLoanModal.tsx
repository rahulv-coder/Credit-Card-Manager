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
import { useData } from '@/lib/context/DataContext';
import { calculateEMI } from '@/lib/utils/calculations';
import {
  validateLoanAmount,
  validateInterestRate,
  validateTenure,
  formatTenureDisplay,
} from '@/lib/utils/validation';

interface AddLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLoan?: import('@/lib/types').Loan;
}

export default function AddLoanModal({ open, onOpenChange, editLoan }: AddLoanModalProps) {
  const { addLoan, addEMI, updateLoan } = useData();
  const isEdit = !!editLoan;

  const getInitialFormData = () => ({
    name: editLoan?.name || '',
    principal: editLoan ? String(editLoan.principal) : '',
    interestRate: editLoan ? String(editLoan.interestRate) : '',
    startDate: editLoan
      ? new Date(editLoan.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    tenureMonths: editLoan?.tenureMonths || 60,
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emiAmount, setEmiAmount] = useState(0);

  // Re-sync when editLoan or open changes
  React.useEffect(() => {
    setFormData(getInitialFormData());
    setErrors({});
    setEmiAmount(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLoan, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Loan name is required';
    }

    if (!validateLoanAmount(formData.principal)) {
      newErrors.principal = 'Principal amount must be a positive number';
    }

    if (!validateInterestRate(formData.interestRate)) {
      newErrors.interestRate = 'Interest rate must be between 0 and 50';
    }

    if (!validateTenure(formData.tenureMonths)) {
      newErrors.tenureMonths = 'Tenure must be between 1 and 360 months';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const validateEmiInputs = (): boolean => {
    return (
      validateLoanAmount(formData.principal) &&
      validateInterestRate(formData.interestRate) &&
      validateTenure(formData.tenureMonths)
    );
  };

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      validateLoanAmount(formData.principal) &&
      validateInterestRate(formData.interestRate) &&
      validateTenure(formData.tenureMonths)
    );
  }, [formData]);

  const handleCalculateEMI = () => {
    if (!validateEmiInputs()) {
      return;
    }
    const emi = calculateEMI(
      parseFloat(formData.principal),
      parseFloat(formData.interestRate),
      formData.tenureMonths
    );
    setEmiAmount(emi);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const principal = parseFloat(formData.principal);
    const startDate = new Date(formData.startDate).getTime();
    const durationMonths = formData.tenureMonths;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    if (isEdit && editLoan) {
      await updateLoan(editLoan.id, {
        name: formData.name,
        principal: parseFloat(formData.principal),
        currentAmount: editLoan.currentAmount,
        interestRate: parseFloat(formData.interestRate),
        tenureMonths: durationMonths,
        startDate,
        endDate: endDate.getTime(),
      });
      handleOpenChange(false);
      return;
    }

    const loanId = await addLoan({
      name: formData.name,
      principal,
      currentAmount: principal,
      interestRate: parseFloat(formData.interestRate),
      tenureMonths: durationMonths,
      startDate,
      endDate: endDate.getTime(),
    });

    if (!loanId) {
      return;
    }

    // Generate EMIs
    const emi = calculateEMI(principal, parseFloat(formData.interestRate), durationMonths);
    const currentDate = new Date(startDate);

    for (let i = 0; i < durationMonths; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      await addEMI({
        loanId,
        emiAmount: emi,
        dueDate: currentDate.getTime(),
        isPaid: false,
        paidDate: null,
      });
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update loan details. EMI schedule will not change.' : 'Create a new loan and auto-generate EMI schedule.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Loan Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Home Loan"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Principal Amount */}
          <div className="space-y-2">
            <Label htmlFor="principal">Principal Amount *</Label>
            <Input
              id="principal"
              type="number"
              placeholder="500000"
              value={formData.principal}
              onChange={(e) => {
                setFormData({ ...formData, principal: e.target.value });
                if (errors.principal) {
                  setErrors({ ...errors, principal: '' });
                }
                setEmiAmount(0);
              }}
              className={errors.principal ? 'border-destructive' : ''}
            />
            {errors.principal && <p className="text-xs text-destructive mt-1">{errors.principal}</p>}
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (% p.a.) *</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              placeholder="7.5"
              value={formData.interestRate}
              onChange={(e) => {
                setFormData({ ...formData, interestRate: e.target.value });
                if (errors.interestRate) {
                  setErrors({ ...errors, interestRate: '' });
                }
                setEmiAmount(0);
              }}
              className={errors.interestRate ? 'border-destructive' : ''}
            />
            {errors.interestRate && <p className="text-xs text-destructive mt-1">{errors.interestRate}</p>}
          </div>

          {/* Tenure Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="tenureMonths">Tenure *</Label>
              <span className="text-sm font-semibold text-primary">{formatTenureDisplay(formData.tenureMonths)}</span>
            </div>
            <div className="space-y-2">
              <input
                id="tenureMonths"
                type="range"
                min="1"
                max="360"
                value={formData.tenureMonths}
                onChange={(e) => {
                  setFormData({ ...formData, tenureMonths: parseInt(e.target.value) });
                  if (errors.tenureMonths) {
                    setErrors({ ...errors, tenureMonths: '' });
                  }
                  setEmiAmount(0);
                }}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 month</span>
                <span>360 months</span>
              </div>
            </div>
            {errors.tenureMonths && <p className="text-xs text-destructive mt-1">{errors.tenureMonths}</p>}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          {/* EMI Calculator Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleCalculateEMI}
            disabled={
              !formData.principal ||
              !formData.interestRate ||
              !validateTenure(formData.tenureMonths)
            }
          >
            Calculate EMI
          </Button>

          {/* EMI Display */}
          {emiAmount > 0 && (
            <div className="p-3 bg-secondary rounded border border-border">
              <p className="text-sm text-muted-foreground">Monthly EMI</p>
              <p className="text-xl font-bold text-primary">₹{emiAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!isFormValid}>
              {isEdit ? 'Save Changes' : 'Add Loan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
