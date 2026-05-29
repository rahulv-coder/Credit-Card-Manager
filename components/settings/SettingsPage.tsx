'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Upload } from 'lucide-react';

export default function SettingsPage() {
  const { data } = useData();
  const [importError, setImportError] = useState('');

  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
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
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        localStorage.setItem('financial_data', JSON.stringify(imported));
        setImportError('');
        alert('Data imported successfully! Please refresh the page.');
        window.location.reload();
      } catch (error) {
        setImportError('Failed to import data. Please ensure the file is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      localStorage.removeItem('financial_data');
      alert('All data has been cleared. Please refresh the page.');
      window.location.reload();
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
