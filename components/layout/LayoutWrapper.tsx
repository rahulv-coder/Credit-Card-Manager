'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Header from './Header';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/20"
          onClick={() => setIsDrawerOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full w-64 bg-white dark:bg-card shadow-lg transition-transform duration-300 ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Financial Hub</h1>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <Navigation onNavigate={() => setIsDrawerOpen(false)} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 border-r border-border bg-white dark:bg-card">
        <div className="w-full flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">Financial Hub</h1>
            <p className="text-xs text-muted-foreground mt-1">Track your finances</p>
          </div>
          <Navigation />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)} />
        <main className="flex-1 overflow-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
