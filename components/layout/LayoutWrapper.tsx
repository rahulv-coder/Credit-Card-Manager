'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Navigation from './Navigation';
import Header from './Header';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isFinance = resolvedTheme === 'finance';

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">

      {/* Finance theme – ambient gold glow orbs */}
      {isFinance && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute rounded-full blur-3xl"
            style={{ top: '5%', left: '5%', width: 420, height: 420,
              background: 'radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 70%)',
              animation: 'orb-breathe 10s ease-in-out infinite' }} />
          <div className="absolute rounded-full blur-3xl"
            style={{ bottom: '5%', right: '5%', width: 500, height: 500,
              background: 'radial-gradient(circle, rgba(184,134,11,0.12) 0%, transparent 70%)',
              animation: 'orb-breathe 13s ease-in-out infinite 2s' }} />
          <div className="absolute rounded-full blur-3xl"
            style={{ top: '50%', left: '45%', width: 560, height: 560, transform: 'translate(-50%,-50%)',
              background: 'radial-gradient(circle, rgba(232,197,71,0.07) 0%, transparent 70%)',
              animation: 'orb-breathe 16s ease-in-out infinite 5s' }} />
          <div className="absolute rounded-full blur-3xl"
            style={{ top: '70%', left: '20%', width: 300, height: 300,
              background: 'radial-gradient(circle, rgba(180,120,10,0.10) 0%, transparent 70%)',
              animation: 'orb-breathe 11s ease-in-out infinite 3s' }} />
        </div>
      )}

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
          className={`absolute left-0 top-0 h-full w-64 shadow-lg transition-transform duration-300 app-drawer ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          } ${!isFinance ? 'bg-white dark:bg-card' : ''}`}
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
      <div
        className={`relative z-10 hidden md:flex md:w-64 border-r border-border app-sidebar ${
          !isFinance ? 'bg-white dark:bg-card' : ''
        }`}
      >
        <div className="w-full flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">Financial Hub</h1>
            <p className="text-xs text-muted-foreground mt-1">Track your finances</p>
          </div>
          <Navigation />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
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

