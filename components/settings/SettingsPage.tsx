'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useData } from '@/lib/context/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Trash2, Upload, Sun, Moon, Sparkles, Check, User, Lock } from 'lucide-react';
import type { Card as CardType, EMI, Loan, Transaction, FinancialData } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
  const { data, importData, clearAllData, profile, updateProfile } = useData();
  const { resolvedTheme, setTheme } = useTheme();
  const [importError, setImportError] = useState('');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    mobile: profile?.mobile || '',
    gender: (profile?.gender || '') as '' | 'male' | 'female',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        mobile: profile.mobile || '',
        gender: (profile.gender || '') as '' | 'male' | 'female',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg('');
    const updates: Record<string, string> = {};
    if (profileForm.firstName) updates.firstName = profileForm.firstName;
    if (profileForm.lastName) updates.lastName = profileForm.lastName;
    if (profileForm.mobile) updates.mobile = profileForm.mobile;
    if (profileForm.gender) updates.gender = profileForm.gender;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateProfile(updates as any);
    setProfileLoading(false);
    setProfileMsg(result.error ? `Error: ${result.error}` : 'Profile saved successfully.');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  // Password change
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (pwForm.newPassword.length < 6) { setPwMsg('Password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('Passwords do not match.'); return; }
    setPwLoading(true);
    setPwMsg('');
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
      setPwMsg(error ? `Error: ${error.message}` : 'Password changed successfully.');
    } else {
      setPwMsg('Supabase not configured.');
    }
    setPwLoading(false);
    setPwForm({ newPassword: '', confirmPassword: '' });
    setTimeout(() => setPwMsg(''), 4000);
  };

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

      {/* Profile */}
      <Card className="p-6 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} placeholder="John" />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} placeholder="Doe" />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile</Label>
            <Input value={profileForm.mobile} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} placeholder="+91 9876543210" />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={profileForm.gender} onValueChange={(v) => setProfileForm({ ...profileForm, gender: v as '' | 'male' | 'female' })}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Button onClick={handleSaveProfile} disabled={profileLoading}>
            {profileLoading ? 'Saving…' : 'Save Profile'}
          </Button>
          {profileMsg && (
            <p className={`text-sm ${profileMsg.startsWith('Error') ? 'text-destructive' : 'text-green-500'}`}>
              {profileMsg}
            </p>
          )}
        </div>
      </Card>

      {/* Password */}
      <Card className="p-6 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 6 characters" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Repeat password" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Button onClick={handleChangePassword} disabled={pwLoading || !pwForm.newPassword}>
            {pwLoading ? 'Updating…' : 'Change Password'}
          </Button>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.startsWith('Error') ? 'text-destructive' : 'text-green-500'}`}>
              {pwMsg}
            </p>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-2">Appearance</h3>
        <p className="text-sm text-muted-foreground mb-5">Choose how the application looks</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className="relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02]"
            style={{
              borderColor: resolvedTheme === 'light' ? '#2563eb' : 'var(--border)',
              background: resolvedTheme === 'light' ? 'rgba(37,99,235,0.06)' : 'var(--secondary)',
            }}
          >
            {resolvedTheme === 'light' && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check size={11} color="#fff" strokeWidth={3} />
              </span>
            )}
            {/* Preview */}
            <div className="rounded-lg overflow-hidden mb-3 border border-border" style={{ background: '#fafbfc', height: 64 }}>
              <div style={{ height: 16, background: '#ffffff', borderBottom: '1px solid #e2e8f0' }} />
              <div className="flex gap-1 p-1.5">
                <div style={{ width: 32, height: 30, borderRadius: 6, background: '#f0f4f8' }} />
                <div className="flex-1 space-y-1 pt-0.5">
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', width: '70%' }} />
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', width: '50%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun size={15} className="text-amber-500" />
              <span className="text-sm font-medium text-foreground">Light</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Clean & bright</p>
          </button>

          {/* Dark */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className="relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02]"
            style={{
              borderColor: resolvedTheme === 'dark' ? '#3b82f6' : 'var(--border)',
              background: resolvedTheme === 'dark' ? 'rgba(59,130,246,0.08)' : 'var(--secondary)',
            }}
          >
            {resolvedTheme === 'dark' && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check size={11} color="#fff" strokeWidth={3} />
              </span>
            )}
            {/* Preview */}
            <div className="rounded-lg overflow-hidden mb-3 border border-border" style={{ background: '#0f1419', height: 64 }}>
              <div style={{ height: 16, background: '#1a2234', borderBottom: '1px solid #2d3748' }} />
              <div className="flex gap-1 p-1.5">
                <div style={{ width: 32, height: 30, borderRadius: 6, background: '#1f2937' }} />
                <div className="flex-1 space-y-1 pt-0.5">
                  <div style={{ height: 6, borderRadius: 3, background: '#374151', width: '70%' }} />
                  <div style={{ height: 6, borderRadius: 3, background: '#374151', width: '50%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon size={15} className="text-blue-400" />
              <span className="text-sm font-medium text-foreground">Dark</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Easy on the eyes</p>
          </button>

          {/* Finance */}
          <button
            type="button"
            onClick={() => setTheme('finance')}
            className="relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02]"
            style={{
              borderColor: resolvedTheme === 'finance' ? '#818cf8' : 'var(--border)',
              background: resolvedTheme === 'finance' ? 'rgba(129,140,248,0.10)' : 'var(--secondary)',
            }}
          >
            {resolvedTheme === 'finance' && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#818cf8,#8b5cf6)' }}>
                <Check size={11} color="#fff" strokeWidth={3} />
              </span>
            )}
            {/* Preview */}
            <div className="rounded-lg overflow-hidden mb-3 border" style={{
              borderColor: 'rgba(212,175,55,0.30)',
              background: 'linear-gradient(135deg,#000000,#0a0700,#140c00)',
              height: 64,
            }}>
              <div style={{ height: 16, background: 'rgba(212,175,55,0.06)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(212,175,55,0.15)' }} />
              <div className="flex gap-1 p-1.5">
                <div style={{ width: 32, height: 30, borderRadius: 6, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }} />
                <div className="flex-1 space-y-1 pt-0.5">
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(212,175,55,0.20)', width: '70%' }} />
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(212,175,55,0.12)', width: '50%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: '#818cf8' }} />
              <span className="text-sm font-medium text-foreground">Finance</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Glassmorphism glow</p>
          </button>
        </div>
      </Card>

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
          <div className="flex items-start justify-between p-4 rounded-lg border bg-destructive/5 border-destructive/30">
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
