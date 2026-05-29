'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
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

export default function LoansPage() {
  const { data, deleteLoan } = useData();
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Loans</h1>
          <p className="text-muted-foreground">Manage and track your loans</p>
        </div>
        <Button onClick={() => setShowAddLoanModal(true)} className="gap-2">
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
                  <button
                    onClick={() => setDeleteConfirmId(loan.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Principal and Amount */}
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

                  {/* Interest Rate */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Interest Rate</p>
                    <p className="font-bold text-foreground">{loan.interestRate.toFixed(2)}% p.a.</p>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <p className="font-medium text-foreground">Progress</p>
                      <p className="text-muted-foreground">{progressPercent.toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Tenure */}
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

      <AddLoanModal open={showAddLoanModal} onOpenChange={setShowAddLoanModal} />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <AlertDialog open={true} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Loan?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{data.loans.find(l => l.id === deleteConfirmId)?.name}</strong>? 
                This action will also delete all EMIs (monthly payments) associated with this loan and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mt-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Deleting a loan will permanently remove all its EMI records. Use this when closing or pre-closing a loan.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteLoan(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
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
