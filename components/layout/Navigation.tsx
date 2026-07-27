'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  Calendar,
  Settings,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  onNavigate?: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'My Cards',
    href: '/cards',
    icon: CreditCard,
  },
  {
    label: 'Loans',
    href: '/loans',
    icon: Banknote,
  },
  {
    label: 'EMIs',
    href: '/emis',
    icon: Calendar,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart2,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function Navigation({ onNavigate }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground hover:bg-secondary'
            )}
          >
            <Icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
