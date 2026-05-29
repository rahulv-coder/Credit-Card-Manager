'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Upload } from 'lucide-react';
import type { Card as CardType, EMI, Loan, Transaction, FinancialData } from '@/lib/types';

type ExportCard = CardType & { transactions: Transaction[] };
type ExportLoan = Loan & { emis: EMI[] };

const buildExportData = (data: FinancialData): { cards: ExportCard[]; loans: ExportLoan[] } => {
  const cards = data.cards.map((card) => ({
    ...card,
    transactions: data.transactions.filter((transaction) => transaction.cardId === card.id),
  }));

  const loans = data.loans.map((loan) => ({
    ...loan,
    emis: data.emis.filter((emi) => emi.loanId === loan.id),
  }));

  return {
    cards,
    loans,
  };
};

const normalizeImportedData = (imported: unknown): FinancialData | null => {
  if (!imported || typeof imported !== 'object') {
    return null;
  }

  const payload = imported as {
    cards?: Array<CardType & { transactions?: Transaction[] }>;
    loans?: Array<Loan & { emis?: EMI[] }>;
    transactions?: Transaction[];
    emis?: EMI[];
  };

  if (Array.isArray(payload.cards) && Array.isArray(payload.loans)) {
    const hasNestedTransactions = payload.cards.some((card) => Array.isArray(card.transactions));
    const hasNestedEmis = payload.loans.some((loan) => Array.isArray(loan.emis));

    if (!hasNestedTransactions && !hasNestedEmis) {
      return {
        cards: payload.cards as CardType[],
        transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
        loans: payload.loans as Loan[],
        emis: Array.isArray(payload.emis) ? payload.emis : [],
      };
    }

    const transactions = payload.cards.flatMap((card) =>
      Array.isArray(card.transactions)
        ? card.transactions.map((transaction) => ({
            ...transaction,
            cardId: transaction.cardId || card.id,
          }))
        : []
    );

    const emis = payload.loans.flatMap((loan) =>
      Array.isArray(loan.emis)
        ? loan.emis.map((emi) => ({
            ...emi,
            loanId: emi.loanId || loan.id,
          }))
        : []
    );

    return {
      cards: payload.cards.map((card) => {
        const cardFields = { ...card };
        delete cardFields.transactions;
        return cardFields as CardType;
      }),
      transactions,
      loans: payload.loans.map((loan) => {
        const loanFields = { ...loan };
        delete loanFields.emis;
        return loanFields as Loan;
      }),
      emis,
    };
  }

  if (
    Array.isArray(payload.cards) &&
    Array.isArray(payload.transactions) &&
    Array.isArray(payload.loans) &&
    Array.isArray(payload.emis)
  ) {
    return {
      cards: payload.cards,
      transactions: payload.transactions,
      loans: payload.loans,
      emis: payload.emis,
    };
  }

  return null;
};

export default function SettingsPage() {
  const { data, importData, clearAllData } = useData();
  const [importError, setImportError] = useState('');

  const handleExportData = () => {
    const exportData = buildExportData(data);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = normalizeImportedData(JSON.parse(event.target?.result as string));
        if (!imported) {
          throw new Error('Invalid data format');
        }

        const success = await importData(imported);
        if (!success) {
          throw new Error('Failed to import to database');
        }

        setImportError('');
        alert('Data imported successfully.');
      } catch {
        setImportError('Failed to import data. Please ensure the file is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      const success = await clearAllData();
      if (success) {
        alert('All data has been cleared.');
      } else {
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and data</p>
      </div>

      {/* Data Management */}
      <Card className="p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-6">Data Management</h3>
        
        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-start justify-between p-4 bg-secondary rounded-lg">
            <div>
              <h4 className="font-medium text-foreground">Export Data</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your data as a JSON file. Useful for backup or migration.
              </p>
            </div>
            <Button onClick={handleExportData} className="gap-2">
              <Download size={18} />
              Export
            </Button>
          </div>

          {/* Import Data */}
          <div className="flex items-start justify-between p-4 bg-secondary rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-foreground">Import Data</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Restore data from a previously exported JSON file.
              </p>
              {importError && (
                <p className="text-sm text-red-500 mt-2">{importError}</p>
              )}
            </div>
            <label className="cursor-pointer">
              <Button asChild className="gap-2">
                <span>
                  <Upload size={18} />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          {/* Clear Data */}
          <div className="flex items-start justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <h4 className="font-medium text-foreground">Clear All Data</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete all your financial data. This action cannot be undone.
              </p>
            </div>
            <Button
              onClick={handleClearData}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 size={18} />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Summary */}
      <Card className="p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-6">Data Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Credit Cards</p>
            <p className="text-3xl font-bold text-blue-500">{data.cards.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-3xl font-bold text-green-500">{data.transactions.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Loans</p>
            <p className="text-3xl font-bold text-purple-500">{data.loans.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">EMIs</p>
            <p className="text-3xl font-bold text-amber-500">{data.emis.length}</p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Credit Card Manager</strong> is a personal finance management application.
          </p>
          <p>
            All your data is stored locally in your browser. We do not collect, store, or transmit any of your financial information.
          </p>
          <p>
            This application is open-source and available under the MIT License.
          </p>
          <p className="pt-2">
            <strong>Version:</strong> 1.0.0
          </p>
        </div>
      </Card>
    </div>
  );
}
