'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
  isDrawerOpen: boolean;
}

export default function Header({ onMenuClick, isDrawerOpen }: HeaderProps) {
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
        {/* Future: Add user profile, notifications, etc. */}
      </div>
    </header>
  );
}
