'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/context/DataContext';
import { Loan } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Calculator } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { calculateEMI } from '@/lib/utils/calculations';
import AddLoanModal from './AddLoanModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Simple debt payoff comparison: Avalanche vs Snowball
function DebtPayoffCalculator({ loans }: { loans: Loan[] }) {
  const [extraPayment, setExtraPayment] = useState('');

  const extra = parseFloat(extraPayment) || 0;

  const totalMonthlyMin = useMemo(() => {
    return loans.reduce((sum, l) => sum + calculateEMI(l.principal, l.interestRate, l.tenureMonths), 0);
  }, [loans]);

  const avalanche = useMemo(() => {
    return [...loans].sort((a, b) => b.interestRate - a.interestRate);
  }, [loans]);

  const snowball = useMemo(() => {
    return [...loans].sort((a, b) => a.currentAmount - b.currentAmount);
  }, [loans]);

  if (loans.length === 0) return null;

  return (
    <Card className="p-6 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Debt Payoff Strategy</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Compare payoff strategies with an optional extra monthly payment.
      </p>

      <div className="flex gap-3 mb-6 max-w-xs">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Extra Monthly Payment (â‚¹)</Label>
          <Input
            type="number"
            placeholder="0"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Avalanche */}
        <div className="bg-secondary rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-1">ðŸ”º Avalanche (Saves Most Interest)</h4>
          <p className="text-xs text-muted-foreground mb-3">Pay highest interest rate first</p>
          <div className="space-y-2">
            {avalanche.map((l, i) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {i + 1}. {l.name}
                </span>
                <span className="text-primary font-medium">{l.interestRate}% p.a.</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            Min monthly: <span className="font-semibold text-foreground">{formatCurrency(totalMonthlyMin)}</span>
            {extra > 0 && (
              <> + <span className="text-green-500 font-semibold">{formatCurrency(extra)}</span> extra</>
            )}
          </div>
        </div>

        {/* Snowball */}
        <div className="bg-secondary rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-1">â›„ Snowball (Best Motivation)</h4>
          <p className="text-xs text-muted-foreground mb-3">Pay smallest balance first</p>
          <div className="space-y-2">
            {snowball.map((l, i) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {i + 1}. {l.name}
                </span>
                <span className="text-blue-500 font-medium">{formatCurrency(l.currentAmount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            Min monthly: <span className="font-semibold text-foreground">{formatCurrency(totalMonthlyMin)}</span>
            {extra > 0 && (
              <> + <span className="text-green-500 font-semibold">{formatCurrency(extra)}</span> extra</>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function LoansPage() {
  const { data, deleteLoan } = useData();
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Loans</h1>
          <p className="text-muted-foreground">Manage and track your loans</p>
        </div>
        <Button onClick={() => { setEditingLoan(null); setShowAddLoanModal(true); }} className="gap-2">
          <Plus size={20} />
          <span className="hidden sm:inline">Add Loan</span>
        </Button>
      </div>

      {/* Loans Grid */}
      {data.loans.length === 0 ? (
        <Card className="p-12 border border-border shadow-sm text-center">
          <p className="text-muted-foreground">No loans yet. Use the Add Loan button above to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.loans.map((loan) => {
            const remainingAmount = loan.currentAmount;
            const progressPercent = ((loan.principal - remainingAmount) / loan.principal) * 100;
            const monthsRemaining = Math.ceil(
              (new Date(loan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
            );

            return (
              <Card key={loan.id} className="p-6 border border-border shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{loan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Created: {formatDate(loan.createdAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingLoan(loan); setShowAddLoanModal(true); }}
                      className="p-2 hover:bg-secondary rounded transition-colors"
                    >
                      <Edit2 size={15} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(loan.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={15} className="text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Principal</p>
                      <p className="font-bold text-foreground">{formatCurrency(loan.principal)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Remaining</p>
                      <p className="font-bold text-red-500">{formatCurrency(remainingAmount)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Interest Rate</p>
                    <p className="font-bold text-foreground">{loan.interestRate.toFixed(2)}% p.a.</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <p className="font-medium text-foreground">Progress</p>
                      <p className="text-muted-foreground">{progressPercent.toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Start Date</p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(loan.startDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Months Left</p>
                      <p className="text-sm font-semibold text-foreground">{Math.max(0, monthsRemaining)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Debt Payoff Calculator */}
      {data.loans.length > 0 && <DebtPayoffCalculator loans={data.loans} />}

      <AddLoanModal
        open={showAddLoanModal}
        onOpenChange={(open) => { setShowAddLoanModal(open); if (!open) setEditingLoan(null); }}
        editLoan={editingLoan ?? undefined}
      />

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <AlertDialog open={true} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Loan?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <strong>{data.loans.find(l => l.id === deleteConfirmId)?.name}</strong>? This will also
                delete all associated EMIs and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mt-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                âš ï¸ All EMI records for this loan will be permanently removed.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { deleteLoan(deleteConfirmId); setDeleteConfirmId(null); }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Loan
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

