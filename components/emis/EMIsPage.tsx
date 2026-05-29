'use client';

import React, { useMemo } from 'react';
import { useData } from '@/lib/context/DataContext';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EMIsPage() {
  const { data, updateEMI, deleteEMI } = useData();
  const { emis, loans } = data;

  const groupedEMIs = useMemo(() => {
    const grouped: { [key: string]: typeof emis } = {};

    emis.forEach((emi) => {
      const loan = loans.find(l => l.id === emi.loanId);
      const loanName = loan?.name || 'Unknown Loan';

      if (!grouped[loanName]) {
        grouped[loanName] = [];
      }
      grouped[loanName].push(emi);
    });

    // Sort EMIs by date within each loan
    Object.keys(grouped).forEach((loanName) => {
      grouped[loanName].sort((a, b) => a.dueDate - b.dueDate);
    });

    return grouped;
  }, [emis, loans]);

  const stats = useMemo(() => {
    const totalEMIs = emis.length;
    const paidEMIs = emis.filter(e => e.isPaid).length;
    const pendingEMIs = totalEMIs - paidEMIs;
    const totalPending = emis
      .filter(e => !e.isPaid)
      .reduce((sum, e) => sum + e.emiAmount, 0);

    return { totalEMIs, paidEMIs, pendingEMIs, totalPending };
  }, [emis]);

  const toggleEMIPaid = (emiId: string, emi: typeof emis[0]) => {
    updateEMI(emiId, {
      ...emi,
      isPaid: !emi.isPaid,
      paidDate: !emi.isPaid ? Date.now() : null,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">EMI Tracker</h1>
        <p className="text-muted-foreground">Track and manage all your EMI payments</p>
      </div>

      {/* Stats */}
      {data.emis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total EMIs</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalEMIs}</p>
          </Card>
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-500">{stats.paidEMIs}</p>
          </Card>
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-red-500">{stats.pendingEMIs}</p>
          </Card>
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Amount Pending</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPending)}</p>
          </Card>
        </div>
      )}

      {/* EMIs List */}
      {Object.keys(groupedEMIs).length === 0 ? (
        <Card className="p-12 border border-border shadow-sm text-center">
          <p className="text-muted-foreground">No EMIs yet. Create a loan to generate EMIs.</p>
        </Card>
      ) : (
        <Tabs defaultValue={Object.keys(groupedEMIs)[0]} className="space-y-6">
          <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(groupedEMIs).length, 4)}, 1fr)` }}>
            {Object.keys(groupedEMIs).map((loanName) => (
              <TabsTrigger key={loanName} value={loanName} className="text-xs">
                {loanName.substring(0, 10)}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedEMIs).map(([loanName, emis]) => (
            <TabsContent key={loanName} value={loanName} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emis.map((emi) => {
                  const daysUntilDue = Math.ceil((emi.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntilDue < 0 && !emi.isPaid;
                  const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0 && !emi.isPaid;

                  return (
                    <Card
                      key={emi.id}
                      className={`p-4 border shadow-sm transition-all ${
                        emi.isPaid
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                          : isOverdue
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                          : isUrgent
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleEMIPaid(emi.id, emi)}
                            className="mt-1 p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            {emi.isPaid ? (
                              <CheckCircle2 size={24} className="text-green-500" />
                            ) : (
                              <Circle size={24} className="text-muted-foreground" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <p className="font-bold text-lg text-foreground">
                                {formatCurrency(emi.emiAmount)}
                              </p>
                              {emi.isPaid && <span className="text-xs font-semibold text-green-600">PAID</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {formatDate(emi.dueDate)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEMI(emi.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>

                      {/* Status */}
                      <div className="text-xs font-medium">
                        {emi.isPaid ? (
                          <p className="text-green-600">
                            Paid on {formatDate(emi.paidDate || Date.now())}
                          </p>
                        ) : isOverdue ? (
                          <p className="text-red-600">Overdue by {Math.abs(daysUntilDue)} days</p>
                        ) : (
                          <p className={isUrgent ? 'text-amber-600' : 'text-muted-foreground'}>
                            {daysUntilDue} days remaining
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
