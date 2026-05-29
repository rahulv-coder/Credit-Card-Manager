'use client';

import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useData } from '@/lib/context/DataContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { signOut, profile, user } = useData();
  const router = useRouter();

  const firstName = profile?.firstName || user?.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    const { error } = await signOut();

    if (error) {
      alert(error.message || 'Failed to sign out. Please try again.');
      return;
    }

    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-white dark:bg-card px-4 py-3 flex items-center justify-between md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <Menu size={20} className="text-foreground" />
        </button>
        <h2 className="text-lg font-semibold text-foreground hidden sm:block">
          Credit Card Manager
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm font-medium text-foreground">Hi, {firstName}</span>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
