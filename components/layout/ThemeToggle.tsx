'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Sparkles } from 'lucide-react';

const THEMES = [
  { key: 'light',   Icon: Sun,       label: 'Light',   activeColor: '#f59e0b' },
  { key: 'dark',    Icon: Moon,      label: 'Dark',    activeColor: '#3b82f6' },
  { key: 'finance', Icon: Sparkles,  label: 'Finance', activeColor: '#818cf8' },
] as const;

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-24 rounded-full bg-secondary" />;

  return (
    <div
      className="flex items-center rounded-full p-0.5 gap-0.5"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      {THEMES.map(({ key, Icon, label, activeColor }) => {
        const isActive = resolvedTheme === key;
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            aria-label={`Switch to ${label} mode`}
            title={`${label} mode`}
            className="relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300"
            style={{
              background: isActive ? activeColor : 'transparent',
              boxShadow: isActive ? `0 2px 8px ${activeColor}55` : 'none',
            }}
          >
            <Icon
              size={13}
              style={{ color: isActive ? '#fff' : 'var(--muted-foreground)', transition: 'color 0.2s' }}
            />
          </button>
        );
      })}
    </div>
  );
}
