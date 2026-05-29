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
import { useData } from '@/lib/context/DataContext';
import { calculateEMI } from '@/lib/utils/calculations';

interface AddLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLoanModal({ open, onOpenChange }: AddLoanModalProps) {
  const { addLoan, addEMI } = useData();
  const [formData, setFormData] = useState({
    name: '',
    principal: '',
    interestRate: '',
    startDate: new Date().toISOString().split('T')[0],
    durationMonths: '',
  });
  const [emiAmount, setEmiAmount] = useState(0);

  const handleCalculateEMI = () => {
    if (formData.principal && formData.interestRate && formData.durationMonths) {
      const emi = calculateEMI(
        parseFloat(formData.principal),
        parseFloat(formData.interestRate),
        parseInt(formData.durationMonths)
      );
      setEmiAmount(emi);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.principal || !formData.interestRate || !formData.durationMonths) {
      alert('Please fill all fields');
      return;
    }

    const principal = parseFloat(formData.principal);
    const startDate = new Date(formData.startDate).getTime();
    const durationMonths = parseInt(formData.durationMonths);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const loanId = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add loan
    addLoan({
      name: formData.name,
      principal,
      currentAmount: principal,
      interestRate: parseFloat(formData.interestRate),
      startDate,
      endDate: endDate.getTime(),
    });

    // Generate EMIs
    const emi = calculateEMI(principal, parseFloat(formData.interestRate), durationMonths);
    let currentDate = new Date(startDate);

    for (let i = 0; i < durationMonths; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      addEMI({
        loanId,
        emiAmount: emi,
        dueDate: currentDate.getTime(),
        isPaid: false,
        paidDate: null,
      });
    }

    setFormData({
      name: '',
      principal: '',
      interestRate: '',
      startDate: new Date().toISOString().split('T')[0],
      durationMonths: '',
    });
    setEmiAmount(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
          <DialogDescription>Create a new loan and auto-generate EMI schedule</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Loan Name</Label>
            <Input
              id="name"
              placeholder="e.g., Home Loan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="principal">Principal Amount</Label>
            <Input
              id="principal"
              type="number"
              placeholder="500000"
              value={formData.principal}
              onChange={(e) => {
                setFormData({ ...formData, principal: e.target.value });
                setEmiAmount(0);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interestRate">Interest Rate (% p.a.)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="7.5"
                value={formData.interestRate}
                onChange={(e) => {
                  setFormData({ ...formData, interestRate: e.target.value });
                  setEmiAmount(0);
                }}
              />
            </div>
            <div>
              <Label htmlFor="durationMonths">Duration (Months)</Label>
              <Input
                id="durationMonths"
                type="number"
                placeholder="60"
                value={formData.durationMonths}
                onChange={(e) => {
                  setFormData({ ...formData, durationMonths: e.target.value });
                  setEmiAmount(0);
                }}
              />
            </div>
          </div>

          <div>
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
          >
            Calculate EMI
          </Button>

          {emiAmount > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground">Monthly EMI</p>
              <p className="text-xl font-bold text-primary">₹{emiAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Loan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
